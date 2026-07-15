'use client';

import React, { useState, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { useMarket } from '@/lib/marketStore';
import { useExplorer } from '@/hooks/useNetworkConfig';
import { Table, TableRow, TableCell } from '../ui/Table';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, RefreshCw, Wallet,
  Clock, Award, Activity, BarChart2, DollarSign,
  ExternalLink, ArrowUpRight, ArrowDownRight, CheckCircle,
} from 'lucide-react';

interface PortfolioViewProps {
  onClaim: (id: bigint) => void;
  claimPending: boolean;
}

export function PortfolioView({ onClaim, claimPending }: PortfolioViewProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address });
  const explorer = useExplorer();

  const {
    btcPrice, balanceSymbol, walletBalance,
    // Active round
    activeRound, activeUserBet, activeUpMultiplier, activeDownMultiplier, timeLeftToLock, timeLeftToEnd, marketStatus,
    // Previous round
    prevRoundId, prevRound, prevUserBet, isClaimable, prevUpMultiplier, prevDownMultiplier,
    // Past round
    pastRoundId, pastRound, pastUserBet, isPastClaimable, pastMultipliers,
  } = useMarket();

  const pastUpMultiplier = pastMultipliers ? Number((pastMultipliers as any)[0] || 0n) / 10000 : 0;
  const pastDownMultiplier = pastMultipliers ? Number((pastMultipliers as any)[1] || 0n) / 10000 : 0;

  const [filterResult, setFilterResult] = useState<'all' | 'won' | 'lost' | 'refund'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchBalance();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const ETH = (wei: bigint) => parseFloat(formatEther(wei));
  const fmt = (n: number, dp = 4) => n.toFixed(dp);

  // ── Open Position (current round) ───────────────────────────────────────────
  const openPosition = useMemo(() => {
    if (!activeUserBet || activeUserBet.amount === 0n) return null;

    const isUp = activeUserBet.position === 0;
    const amount = ETH(activeUserBet.amount);
    const mult = isUp ? activeUpMultiplier : activeDownMultiplier;
    const estReturn = mult > 0 ? amount * mult : amount * 1.9;

    // Time display
    const timeLeft = marketStatus === 'OPEN' ? timeLeftToLock : timeLeftToEnd;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeLabel = timeLeft > 0 ? `${mins}m ${secs}s` : marketStatus;

    // Unrealised PnL vs current entry price
    const entryPrice = activeRound ? Number(activeRound.startPrice) / 1e8 : 0;
    const priceDelta = entryPrice > 0 ? ((btcPrice - entryPrice) / entryPrice) * 100 : 0;

    return {
      roundId: activeRound?.roundId?.toString() ?? '—',
      direction: isUp ? 'UP' : 'DOWN',
      amount,
      mult: mult > 0 ? mult : 1.9,
      estReturn,
      status: marketStatus,
      timeLabel,
      priceDelta,
      claimed: activeUserBet.claimed,
    };
  }, [activeUserBet, activeRound, activeUpMultiplier, activeDownMultiplier, marketStatus, timeLeftToLock, timeLeftToEnd, btcPrice]);

  // ── Settled Positions (prev + past rounds) ──────────────────────────────────
  const settledPositions = useMemo(() => {
    const positions: {
      roundId: string;
      direction: string;
      amount: number;
      payout: number;
      pnl: number;
      result: 'WON' | 'LOST' | 'REFUND' | 'OPEN';
      claimable: boolean;
      claimRoundId: bigint;
      resolvedAt: string;
    }[] = [];

    const processRound = (
      round: typeof prevRound,
      bet: typeof prevUserBet,
      claimable: boolean,
      claimRoundId: bigint,
      upMult: number,
      downMult: number,
      label: string,
    ) => {
      if (!bet || bet.amount === 0n) return;

      const isUp = bet.position === 0;
      const amount = ETH(bet.amount);

      if (round?.canceled) {
        positions.push({
          roundId: round.roundId.toString(),
          direction: isUp ? 'UP' : 'DOWN',
          amount,
          payout: amount,
          pnl: 0,
          result: 'REFUND',
          claimable,
          claimRoundId,
          resolvedAt: label,
        });
        return;
      }

      if (!round?.resolved) {
        positions.push({
          roundId: round?.roundId?.toString() ?? '?',
          direction: isUp ? 'UP' : 'DOWN',
          amount,
          payout: 0,
          pnl: 0,
          result: 'OPEN',
          claimable: false,
          claimRoundId,
          resolvedAt: label,
        });
        return;
      }

      const upWins = round.closePrice > round.startPrice;
      const won = (isUp && upWins) || (!isUp && !upWins);
      const winMult = isUp ? upMult : downMult;
      const payout = won && winMult > 0 ? amount * winMult : 0;
      const pnl = payout > 0 ? payout - amount : -amount;

      positions.push({
        roundId: round.roundId.toString(),
        direction: isUp ? 'UP' : 'DOWN',
        amount,
        payout,
        pnl,
        result: won ? 'WON' : 'LOST',
        claimable,
        claimRoundId,
        resolvedAt: label,
      });
    };

    processRound(prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier, 'Last round');
    processRound(pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMultiplier, pastDownMultiplier, '2 rounds ago');

    return positions;
  }, [prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier,
      pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMultiplier, pastDownMultiplier]);

  // ── Aggregate Stats from real data ──────────────────────────────────────────
  const stats = useMemo(() => {
    const resolved = settledPositions.filter(p => p.result === 'WON' || p.result === 'LOST');
    const won = resolved.filter(p => p.result === 'WON');
    const totalPnl = resolved.reduce((sum, p) => sum + p.pnl, 0);
    const winRate = resolved.length > 0 ? (won.length / resolved.length) * 100 : 0;
    const totalWagered = resolved.reduce((sum, p) => sum + p.amount, 0);
    const roi = totalWagered > 0 ? (totalPnl / totalWagered) * 100 : 0;
    const avgBet = resolved.length > 0 ? totalWagered / resolved.length : 0;
    const openCount = openPosition ? 1 : 0;
    const lockedAmount = openPosition?.amount ?? 0;

    return {
      available: walletBalance,
      locked: lockedAmount,
      totalPnl,
      winRate,
      roi,
      avgBet,
      resolved: resolved.length,
      openCount,
    };
  }, [settledPositions, openPosition, walletBalance]);

  // ── Filter settled table ────────────────────────────────────────────────────
  const filteredSettled = useMemo(() => {
    if (filterResult === 'all') return settledPositions;
    if (filterResult === 'refund') return settledPositions.filter(p => p.result === 'REFUND');
    return settledPositions.filter(p => p.result.toLowerCase() === filterResult);
  }, [settledPositions, filterResult]);

  // ── Compact time display ────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    if (secs <= 0) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', margin: 0 }}>
            Portfolio Dashboard
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Live on-chain data from your connected wallet
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isConnected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px' }}>
              <Wallet size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          )}
          <Button variant="secondary" size="md" onClick={handleRefresh} disabled={isRefreshing} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '20px' }}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {[
          {
            label: 'AVAILABLE BALANCE',
            value: `${fmt(stats.available)} ${balanceSymbol}`,
            icon: <Wallet size={14} />,
            desc: 'Live wallet balance',
          },
          {
            label: 'LOCKED IN POSITIONS',
            value: stats.locked > 0 ? `${fmt(stats.locked)} ${balanceSymbol}` : '—',
            icon: <Clock size={14} />,
            desc: 'Committed in active round',
          },
          {
            label: 'TOTAL PROFIT / LOSS',
            value: stats.totalPnl !== 0
              ? `${stats.totalPnl > 0 ? '+' : ''}${fmt(stats.totalPnl)} ${balanceSymbol}`
              : '—',
            icon: <Activity size={14} />,
            desc: 'Sum across settled rounds',
          },
          {
            label: 'WIN RATE',
            value: stats.resolved > 0 ? `${stats.winRate.toFixed(1)}%` : '—',
            icon: <Award size={14} />,
            desc: `${stats.resolved} settled rounds`,
          },
          {
            label: 'PORTFOLIO ROI',
            value: stats.resolved > 0
              ? `${stats.roi > 0 ? '+' : ''}${stats.roi.toFixed(1)}%`
              : '—',
            icon: <TrendingUp size={14} />,
            desc: 'Return on total wagered',
          },
          {
            label: 'OPEN / SETTLED',
            value: `${stats.openCount} / ${stats.resolved}`,
            icon: <BarChart2 size={14} />,
            desc: 'Active vs completed predictions',
          },
          {
            label: 'AVERAGE BET SIZE',
            value: stats.avgBet > 0 ? `${fmt(stats.avgBet)} ${balanceSymbol}` : '—',
            icon: <DollarSign size={14} />,
            desc: 'Mean stake per round',
          },
          {
            label: 'LIVE BTC PRICE',
            value: btcPrice > 0 ? `$${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
            icon: <Activity size={14} />,
            desc: 'Pyth Network oracle price',
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            style={{
              background: 'rgba(5, 5, 5, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{card.label}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>{card.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 300, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{card.value}</div>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', display: 'block' }}>{card.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Open Position ──────────────────────────────────────────────── */}
      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(5,5,5,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
            OPEN POSITION ({stats.openCount})
          </span>
        </div>

        <div style={{ padding: '20px' }}>
          {!isConnected ? (
            <Empty msg="Connect wallet to view active bets" />
          ) : !openPosition ? (
            <Empty msg="No open position this round — place a prediction to get started" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {/* Direction card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>ROUND #{openPosition.roundId}</span>
                  <span style={{
                    fontSize: '9px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                    background: openPosition.status === 'OPEN' ? '#ffffff' : 'rgba(255,255,255,0.06)',
                    color: openPosition.status === 'OPEN' ? '#000000' : '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {openPosition.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {openPosition.direction === 'UP'
                    ? <ArrowUpRight size={20} style={{ color: '#ffffff' }} />
                    : <ArrowDownRight size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />}
                  <span style={{ fontSize: '22px', fontWeight: 300, fontFamily: 'var(--font-mono)' }}>
                    {openPosition.direction}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={10} /> {openPosition.timeLabel}
                </div>
              </div>

              {/* Stats */}
              {[
                { label: 'AMOUNT STAKED', value: `${fmt(openPosition.amount)} ${balanceSymbol}` },
                { label: 'MULTIPLIER', value: `${openPosition.mult.toFixed(2)}×` },
                { label: 'EST. RETURN', value: `${fmt(openPosition.estReturn)} ${balanceSymbol}` },
                { label: 'EST. PROFIT', value: `+${fmt(openPosition.estReturn - openPosition.amount)} ${balanceSymbol}` },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>{s.label}</span>
                  <span style={{ fontSize: '18px', fontWeight: 300, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Settled Positions ──────────────────────────────────────────── */}
      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(5,5,5,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>SETTLED POSITIONS ({stats.resolved})</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'won', 'lost', 'refund'] as const).map((f) => (
              <button key={f} onClick={() => setFilterResult(f)} style={{
                background: filterResult === f ? '#ffffff' : 'rgba(255,255,255,0.02)',
                color: filterResult === f ? '#000000' : 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '4px 10px',
                fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {!isConnected ? (
            <div style={{ padding: '40px' }}><Empty msg="Connect wallet to view settled predictions" /></div>
          ) : filteredSettled.length === 0 ? (
            <div style={{ padding: '40px' }}><Empty msg="No settled rounds found for this wallet yet" /></div>
          ) : (
            <Table headers={['ROUND', 'PREDICTION', 'RESULT', 'STAKED', 'PAYOUT', 'PNL', 'CLAIM', 'ROUND AGO']}>
              {filteredSettled.map((pos, idx) => (
                <TableRow key={idx}>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{pos.roundId}</TableCell>
                  <TableCell>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: pos.direction === 'UP' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}>
                      {pos.direction === 'UP' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {pos.direction}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: pos.result === 'WON' ? '#ffffff' : pos.result === 'REFUND' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>
                      {pos.result}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{fmt(pos.amount)} {balanceSymbol}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                    {pos.result === 'OPEN' ? '—' : fmt(pos.payout)} {pos.result !== 'OPEN' ? balanceSymbol : ''}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', color: pos.pnl > 0 ? '#ffffff' : pos.pnl < 0 ? 'rgba(255,255,255,0.45)' : 'var(--text-secondary)' }}>
                    {pos.result === 'OPEN' ? '—' : `${pos.pnl > 0 ? '+' : ''}${fmt(pos.pnl)} ${balanceSymbol}`}
                  </TableCell>
                  <TableCell>
                    {pos.claimable ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={claimPending}
                        onClick={() => onClaim(pos.claimRoundId)}
                        style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px' }}
                      >
                        {claimPending ? 'CLAIMING...' : 'CLAIM'}
                      </Button>
                    ) : pos.result === 'WON' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        <CheckCircle size={12} /> Claimed
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{pos.resolvedAt}</TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </div>
      </div>

      {/* ── No wallet / not connected fallback ─────────────────────────── */}
      {!isConnected && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px', gap: '12px',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <Wallet size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Wallet Not Connected</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
            Connect your wallet to view your real portfolio, open positions, and settled prediction history.
          </span>
        </div>
      )}

    </div>
  );
}

// ── Small helper component ───────────────────────────────────────────────────
function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '100px', textAlign: 'center' }}>
      <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>Nothing to Show</span>
      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '280px' }}>{msg}</span>
    </div>
  );
}
