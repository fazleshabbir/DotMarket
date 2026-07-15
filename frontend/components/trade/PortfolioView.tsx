'use client';

import React, { useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { useMarket } from '@/lib/marketStore';
import { useExplorer } from '@/hooks/useNetworkConfig';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Clock, Wallet,
  CheckCircle, RefreshCw, TrendingUp, BarChart2,
} from 'lucide-react';

interface PortfolioViewProps {
  onClaim: (id: bigint) => void;
  claimPending: boolean;
}

export function PortfolioView({ onClaim, claimPending }: PortfolioViewProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address });

  const {
    btcPrice, balanceSymbol, walletBalance,
    activeRound, activeUserBet, activeUpMultiplier, activeDownMultiplier,
    timeLeftToLock, timeLeftToEnd, marketStatus,
    prevRoundId, prevRound, prevUserBet, isClaimable, prevUpMultiplier, prevDownMultiplier,
    pastRoundId, pastRound, pastUserBet, isPastClaimable, pastMultipliers,
  } = useMarket();

  const pastUpMult  = pastMultipliers ? Number((pastMultipliers as any)[0] || 0n) / 10000 : 0;
  const pastDownMult = pastMultipliers ? Number((pastMultipliers as any)[1] || 0n) / 10000 : 0;

  // ── helpers ─────────────────────────────────────────────────────────────────
  const ETH  = (wei: bigint) => parseFloat(formatEther(wei));
  const fmt4 = (n: number)   => n.toFixed(4);

  const timeLabel = () => {
    const s = marketStatus === 'OPEN' ? timeLeftToLock : timeLeftToEnd;
    if (s <= 0) return marketStatus;
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // ── open position ────────────────────────────────────────────────────────────
  const open = useMemo(() => {
    if (!activeUserBet || activeUserBet.amount === 0n) return null;
    const isUp   = activeUserBet.position === 0;
    const amount = ETH(activeUserBet.amount);
    const mult   = (isUp ? activeUpMultiplier : activeDownMultiplier) || 1.9;
    return { isUp, amount, mult, estReturn: amount * mult, roundId: activeRound?.roundId?.toString() ?? '—' };
  }, [activeUserBet, activeRound, activeUpMultiplier, activeDownMultiplier]);

  // ── settled rounds builder ───────────────────────────────────────────────────
  type RoundCard = {
    roundId: bigint; label: string; isUp: boolean; amount: number;
    payout: number; pnl: number; result: 'WON' | 'LOST' | 'REFUND' | 'PENDING';
    claimable: boolean;
  };

  const rounds: RoundCard[] = useMemo(() => {
    const build = (
      round: typeof prevRound, bet: typeof prevUserBet,
      claimable: boolean, rid: bigint,
      upM: number, downM: number, label: string,
    ): RoundCard | null => {
      if (!bet || bet.amount === 0n) return null;
      const isUp = bet.position === 0;
      const amt  = ETH(bet.amount);
      if (round?.canceled) return { roundId: rid, label, isUp, amount: amt, payout: amt, pnl: 0, result: 'REFUND', claimable };
      if (!round?.resolved) return { roundId: rid, label, isUp, amount: amt, payout: 0, pnl: 0, result: 'PENDING', claimable: false };
      const won   = (isUp && round.closePrice > round.startPrice) || (!isUp && round.closePrice < round.startPrice);
      const mult  = isUp ? upM : downM;
      const pay   = won && mult > 0 ? amt * mult : 0;
      return { roundId: rid, label, isUp, amount: amt, payout: pay, pnl: pay > 0 ? pay - amt : -amt, result: won ? 'WON' : 'LOST', claimable };
    };
    return [
      build(prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier, 'Previous round'),
      build(pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMult, pastDownMult, '2 rounds ago'),
    ].filter(Boolean) as RoundCard[];
  }, [prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier,
      pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMult, pastDownMult]);

  // ── aggregate ────────────────────────────────────────────────────────────────
  const settled  = rounds.filter(r => r.result === 'WON' || r.result === 'LOST');
  const wins     = settled.filter(r => r.result === 'WON').length;
  const totalPnl = settled.reduce((s, r) => s + r.pnl, 0);
  const winRate  = settled.length > 0 ? Math.round((wins / settled.length) * 100) : null;

  // ── not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={28} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Wallet not connected</p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Connect your wallet to see your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto', width: '100%', padding: '4px 0' }}>

      {/* ══ 1. WALLET HERO ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* Balance */}
        <div>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>WALLET BALANCE</p>
          <p style={{ margin: '6px 0 0', fontSize: '36px', fontWeight: 300, fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>
            {fmt4(walletBalance)}
            <span style={{ fontSize: '16px', marginLeft: '8px', color: 'rgba(255,255,255,0.5)' }}>{balanceSymbol}</span>
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <Stat label="WIN RATE" value={winRate !== null ? `${winRate}%` : '—'} />
          <Stat label="ALL-TIME PNL" value={
            totalPnl !== 0
              ? `${totalPnl > 0 ? '+' : ''}${fmt4(totalPnl)} ${balanceSymbol}`
              : '—'
          } positive={totalPnl > 0} negative={totalPnl < 0} />
          <Stat label="ROUNDS TRACKED" value={`${settled.length}`} />
        </div>

        <button
          onClick={() => refetchBalance()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'all 150ms' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </motion.div>

      {/* ══ 2. ACTIVE POSITION ══════════════════════════════════════════ */}
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            border: '1.5px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Label bar */}
          <div style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)' }}>ACTIVE POSITION — ROUND #{open.roundId}</span>
          </div>

          {/* Content */}
          <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '32px', alignItems: 'center' }}>
            {/* Big direction */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: `2px solid ${open.isUp ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {open.isUp
                  ? <ArrowUpRight size={26} style={{ color: '#fff' }} />
                  : <ArrowDownRight size={26} style={{ color: 'rgba(255,255,255,0.5)' }} />}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: open.isUp ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                {open.isUp ? 'UP' : 'DOWN'}
              </span>
            </div>

            <Breakdown label="STAKED" value={`${fmt4(open.amount)} ${balanceSymbol}`} />
            <Breakdown label="MULTIPLIER" value={`${open.mult.toFixed(2)}×`} />
            <Breakdown label="EST. PAYOUT" value={`${fmt4(open.estReturn)} ${balanceSymbol}`} sub={`+${fmt4(open.estReturn - open.amount)} profit`} />
          </div>

          {/* Footer countdown */}
          <div style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            <Clock size={13} />
            <span>{marketStatus === 'OPEN' ? 'Locks in' : 'Settles in'} <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{timeLabel()}</strong></span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            border: '1px dashed rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <BarChart2 size={18} />
          <span style={{ fontSize: '13px' }}>No active position this round — head to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Live Market</strong> to place a prediction.</span>
        </motion.div>
      )}

      {/* ══ 3. RECENT ROUNDS ════════════════════════════════════════════ */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>RECENT ROUNDS</p>

        {rounds.length === 0 ? (
          <div style={{ border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            Your settled prediction history will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rounds.map((r, i) => (
              <motion.div
                key={r.roundId.toString()}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                style={{
                  border: r.claimable
                    ? '1.5px solid rgba(255,255,255,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                  background: r.claimable ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}
              >
                {/* Direction icon */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: r.result === 'WON' ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}>
                  {r.isUp
                    ? <ArrowUpRight size={18} style={{ color: r.result === 'WON' ? '#fff' : 'rgba(255,255,255,0.4)' }} />
                    : <ArrowDownRight size={18} style={{ color: r.result === 'WON' ? '#fff' : 'rgba(255,255,255,0.4)' }} />}
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#fff' }}>Round #{r.roundId.toString()}</span>
                    {/* Result badge */}
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: r.result === 'WON' ? '#ffffff' : r.result === 'REFUND' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      color: r.result === 'WON' ? '#000' : r.result === 'LOST' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)',
                    }}>
                      {r.result}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                    <span>Staked: <strong style={{ color: '#fff' }}>{fmt4(r.amount)}</strong> {balanceSymbol}</span>
                    {r.result !== 'PENDING' && r.payout > 0 && (
                      <span>Payout: <strong style={{ color: '#fff' }}>{fmt4(r.payout)}</strong> {balanceSymbol}</span>
                    )}
                    {r.result !== 'PENDING' && r.pnl !== 0 && (
                      <span style={{ color: r.pnl > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                        PnL: <strong>{r.pnl > 0 ? '+' : ''}{fmt4(r.pnl)}</strong> {balanceSymbol}
                      </span>
                    )}
                  </div>
                </div>

                {/* Claim action */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {r.claimable ? (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={claimPending}
                      onClick={() => onClaim(r.roundId)}
                      style={{ minWidth: '100px', fontSize: '12px', fontWeight: 700 }}
                    >
                      {claimPending ? 'Claiming…' : '✦ Claim'}
                    </Button>
                  ) : r.result === 'WON' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                      <CheckCircle size={14} /> Claimed
                    </span>
                  ) : r.result === 'PENDING' ? (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Awaiting…</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Stat({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{
        fontSize: '18px', fontWeight: 300, fontFamily: 'var(--font-mono)',
        color: positive ? '#ffffff' : negative ? 'rgba(255,255,255,0.5)' : '#ffffff',
      }}>
        {value}
      </span>
    </div>
  );
}

function Breakdown({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: '22px', fontWeight: 300, fontFamily: 'var(--font-mono)', color: '#fff' }}>{value}</span>
      {sub && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{sub}</span>}
    </div>
  );
}
