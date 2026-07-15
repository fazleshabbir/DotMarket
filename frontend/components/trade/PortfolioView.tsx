'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { useMarket } from '@/lib/marketStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Clock, Wallet, RefreshCw,
  CheckCircle, TrendingUp, TrendingDown, Zap, Activity,
} from 'lucide-react';

interface PortfolioViewProps {
  onClaim: (id: bigint) => void;
  claimPending: boolean;
}

// ── Animated rolling counter ─────────────────────────────────────────────────
function Counter({ value, decimals = 4, prefix = '', suffix = '' }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    let start = prev.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

// ── SVG arc ring for open position timer ────────────────────────────────────
function ProgressRing({ progress, size = 56, urgent = false }: {
  progress: number; size?: number; urgent?: boolean;
}) {
  const sw = 3;
  const r  = (size - sw) / 2;
  const c  = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={urgent ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.7)'}
        strokeWidth={sw}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
          filter: urgent ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' : undefined,
        }}
      />
    </svg>
  );
}

export function PortfolioView({ onClaim, claimPending }: PortfolioViewProps) {
  const { address, isConnected } = useAccount();
  const { refetch: refetchBalance } = useBalance({ address });
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const {
    btcPrice, balanceSymbol, walletBalance,
    activeRound, activeUserBet, activeUpMultiplier, activeDownMultiplier,
    timeLeftToLock, timeLeftToEnd, marketStatus,
    prevRoundId, prevRound, prevUserBet, isClaimable,
    prevUpMultiplier, prevDownMultiplier,
    pastRoundId, pastRound, pastUserBet, isPastClaimable, pastMultipliers,
  } = useMarket();

  // tick every second for countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const pastUpMult   = pastMultipliers ? Number((pastMultipliers as any)[0] || 0n) / 10000 : 0;
  const pastDownMult = pastMultipliers ? Number((pastMultipliers as any)[1] || 0n) / 10000 : 0;

  const ETH = (wei: bigint) => parseFloat(formatEther(wei));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchBalance();
    setTimeout(() => setRefreshing(false), 700);
  };

  // ── Open position ────────────────────────────────────────────────────────
  const open = useMemo(() => {
    if (!activeUserBet || activeUserBet.amount === 0n) return null;
    const isUp   = activeUserBet.position === 0;
    const amount = ETH(activeUserBet.amount);
    const mult   = (isUp ? activeUpMultiplier : activeDownMultiplier) || 1.9;
    const totalSecs    = (() => {
      if (!activeRound) return 60;
      if (marketStatus === 'OPEN') {
        const s = Number(activeRound.startTimestamp), l = Number(activeRound.lockTimestamp);
        return l > s ? l - s : 60;
      }
      const l = Number(activeRound.lockTimestamp), e = Number(activeRound.endTimestamp);
      return e > l ? e - l : 60;
    })();
    const timeLeft = marketStatus === 'OPEN' ? timeLeftToLock : timeLeftToEnd;
    const progress = totalSecs > 0 ? timeLeft / totalSecs : 0;
    const urgent   = timeLeft > 0 && timeLeft <= 10;

    // Live PnL vs entry
    const entryPrice = activeRound ? Number(activeRound.startPrice) / 1e8 : 0;
    const priceDelta = entryPrice > 0 ? ((btcPrice - entryPrice) / entryPrice) * 100 : 0;
    const isWinning  = (isUp && btcPrice > entryPrice) || (!isUp && btcPrice < entryPrice);

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = timeLeft > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : '—';

    return { isUp, amount, mult, estReturn: amount * mult, roundId: activeRound?.roundId?.toString() ?? '—',
             progress, urgent, timeStr, entryPrice, priceDelta, isWinning, marketStatus };
  }, [activeUserBet, activeRound, activeUpMultiplier, activeDownMultiplier, marketStatus,
      timeLeftToLock, timeLeftToEnd, btcPrice, tick]);

  // ── Settled rounds ───────────────────────────────────────────────────────
  type Round = {
    roundId: bigint; label: string; isUp: boolean; amount: number;
    payout: number; pnl: number; result: 'WON'|'LOST'|'REFUND'|'PENDING';
    claimable: boolean;
  };

  const rounds: Round[] = useMemo(() => {
    const build = (
      round: typeof prevRound, bet: typeof prevUserBet,
      claimable: boolean, rid: bigint, upM: number, downM: number, label: string
    ): Round | null => {
      if (!bet || bet.amount === 0n) return null;
      const isUp = bet.position === 0;
      const amt  = ETH(bet.amount);
      if (round?.canceled) return { roundId: rid, label, isUp, amount: amt, payout: amt, pnl: 0, result: 'REFUND', claimable };
      if (!round?.resolved) return { roundId: rid, label, isUp, amount: amt, payout: 0, pnl: 0, result: 'PENDING', claimable: false };
      const won  = (isUp && round.closePrice > round.startPrice) || (!isUp && round.closePrice < round.startPrice);
      const m    = isUp ? upM : downM;
      const pay  = won && m > 0 ? amt * m : 0;
      return { roundId: rid, label, isUp, amount: amt, payout: pay, pnl: pay > 0 ? pay - amt : -amt, result: won ? 'WON' : 'LOST', claimable };
    };
    return [
      build(prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier, 'Previous round'),
      build(pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMult, pastDownMult, '2 rounds ago'),
    ].filter(Boolean) as Round[];
  }, [prevRound, prevUserBet, isClaimable, prevRoundId, prevUpMultiplier, prevDownMultiplier,
      pastRound, pastUserBet, isPastClaimable, pastRoundId, pastUpMult, pastDownMult]);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const settled  = rounds.filter(r => r.result === 'WON' || r.result === 'LOST');
  const wins     = settled.filter(r => r.result === 'WON').length;
  const totalPnl = settled.reduce((s, r) => s + r.pnl, 0);
  const winRate  = settled.length > 0 ? (wins / settled.length) * 100 : 0;
  const totalWagered = settled.reduce((s, r) => s + r.amount, 0);
  const roi      = totalWagered > 0 ? (totalPnl / totalWagered) * 100 : 0;

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center' }}
      >
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <Wallet size={30} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', fontFamily: "'Cormorant Garamond', serif" }}>Connect your wallet</p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Your portfolio, positions and claim history will appear here.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto', width: '100%' }}>

      <style>{`
        @keyframes breathe {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.06); }
          50%      { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes urgentPulse {
          0%,100% { filter: drop-shadow(0 0 4px rgba(255,255,255,0.4)); }
          50%      { filter: drop-shadow(0 0 12px rgba(255,255,255,0.9)); }
        }
        .claim-btn:hover { background: #e0e0e0 !important; transform: scale(1.03); }
        .claim-btn { transition: all 160ms ease !important; }
        .stat-card:hover { border-color: rgba(255,255,255,0.14) !important; background: rgba(255,255,255,0.035) !important; }
        .stat-card { transition: all 220ms ease !important; }
        .round-card:hover { border-color: rgba(255,255,255,0.14) !important; }
        .round-card { transition: border-color 220ms ease !important; }
      `}</style>

      {/* ══ WALLET HERO ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(255,255,255,0.015)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24,
          alignItems: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scan line decoration */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '30%', background: 'linear-gradient(180deg, rgba(255,255,255,0.012) 0%, transparent 100%)', animation: 'scanLine 8s linear infinite', top: 0 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>Wallet Balance</span>
          </div>
          <div style={{ fontSize: 42, fontWeight: 300, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-1px', fontFeatureSettings: "'tnum'" }}>
            <Counter value={walletBalance} decimals={4} />
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{balanceSymbol}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {address?.slice(0, 10)}...{address?.slice(-6)}
          </div>
        </div>

        {/* Right: live BTC + refresh */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>BTC / USD</div>
            <div style={{ fontSize: 22, fontWeight: 300, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', marginTop: 2, fontFeatureSettings: "'tnum'" }}>
              $<Counter value={btcPrice} decimals={2} />
            </div>
          </div>
          <button
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '8px 16px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', transition: 'all 150ms' }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ══ STATS ROW ════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          {
            label: 'WIN RATE',
            value: settled.length > 0 ? `${winRate.toFixed(0)}%` : '—',
            sub: `${wins} / ${settled.length} rounds`,
            icon: <Activity size={14} />,
            positive: winRate >= 50,
          },
          {
            label: 'TOTAL PNL',
            value: settled.length > 0 ? `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(4)}` : '—',
            sub: totalPnl >= 0 ? 'Net profit' : 'Net loss',
            icon: totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
            positive: totalPnl > 0,
            negative: totalPnl < 0,
          },
          {
            label: 'ROI',
            value: settled.length > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%` : '—',
            sub: 'Return on wagered',
            icon: <Zap size={14} />,
            positive: roi > 0,
            negative: roi < 0,
          },
          {
            label: 'ACTIVE NOW',
            value: open ? '1 Position' : 'None',
            sub: open ? `Round #${open.roundId}` : 'No open bets',
            icon: <Clock size={14} />,
            positive: !!open,
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="stat-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
              <span style={{ color: 'var(--text-3)' }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.negative ? 'var(--text-2)' : 'var(--text-1)', fontFeatureSettings: "'tnum'" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ══ OPEN POSITION ════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
          Active Position
        </div>

        {!open ? (
          <div style={{ border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-lg)', padding: '36px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.25)', flexDirection: 'column' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>No active position</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>Switch to Live Market to place a prediction</p>
            </div>
          </div>
        ) : (
          <div style={{
            border: `1.5px solid ${open.isWinning ? 'rgba(255,255,255,0.2)' : 'var(--border-2)'}`,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: open.isWinning ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)',
            transition: 'all 500ms ease',
            animation: 'breathe 3s ease-in-out infinite',
          }}>
            {/* Top bar */}
            <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.7)', animation: 'urgentPulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-2)', fontFamily: 'var(--font-sans)' }}>LIVE — ROUND #{open.roundId}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: open.marketStatus === 'OPEN' ? '#fff' : 'rgba(255,255,255,0.08)', color: open.marketStatus === 'OPEN' ? '#000' : '#fff', letterSpacing: '0.05em' }}>
                {open.marketStatus}
              </span>
            </div>

            {/* Body grid */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
              {/* Ring timer + direction */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', animation: open.urgent ? 'urgentPulse 0.8s infinite' : 'none' }}>
                  <ProgressRing progress={open.progress} size={68} urgent={open.urgent} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {open.isUp
                      ? <ArrowUpRight size={14} style={{ color: '#fff' }} />
                      : <ArrowDownRight size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{open.timeStr}</span>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: open.isUp ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                  {open.isUp ? 'UP' : 'DOWN'}
                </span>
              </div>

              {/* Stats */}
              <OpenStat label="STAKED" value={`${open.amount.toFixed(4)}`} unit={balanceSymbol} />
              <OpenStat label="MULTIPLIER" value={`${open.mult.toFixed(2)}×`} />
              <OpenStat label="EST. PAYOUT" value={`${open.estReturn.toFixed(4)}`} unit={balanceSymbol}
                sub={`+${(open.estReturn - open.amount).toFixed(4)} profit`} />
            </div>

            {/* Live price comparison bar */}
            {open.entryPrice > 0 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                    Entry: ${open.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: open.isWinning ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                    {open.isWinning ? '▲ WINNING' : '▼ LOSING'} &nbsp;
                    {open.priceDelta >= 0 ? '+' : ''}{open.priceDelta.toFixed(3)}%
                  </span>
                </div>
                {/* Delta bar */}
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    width: `${Math.min(Math.abs(open.priceDelta) * 10, 50)}%`,
                    height: '100%',
                    background: open.isWinning ? '#fff' : 'rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    transition: 'width 500ms ease, background 500ms ease',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ══ SETTLED ROUNDS ═══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
          Recent Rounds
        </div>

        {rounds.length === 0 ? (
          <div style={{ border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-lg)', padding: '36px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            Your settled prediction history will appear here once rounds complete.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {rounds.map((r, i) => {
                const won     = r.result === 'WON';
                const lost    = r.result === 'LOST';
                const refund  = r.result === 'REFUND';
                const pending = r.result === 'PENDING';

                return (
                  <motion.div
                    key={r.roundId.toString()}
                    className="round-card"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      border: r.claimable ? '1.5px solid rgba(255,255,255,0.22)' : '1px solid var(--border-2)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      background: r.claimable ? 'rgba(255,255,255,0.025)' : 'transparent',
                      animation: r.claimable ? 'breathe 2.5s ease-in-out infinite' : 'none',
                    }}
                  >
                    {/* Claimable highlight bar */}
                    {r.claimable && (
                      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                    )}

                    <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 16, alignItems: 'center' }}>
                      {/* Direction icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: `1px solid ${won ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        background: won ? 'rgba(255,255,255,0.06)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {r.isUp
                          ? <ArrowUpRight size={18} style={{ color: won ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                          : <ArrowDownRight size={18} style={{ color: won ? '#fff' : 'rgba(255,255,255,0.3)' }} />}
                      </div>

                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-1)', fontFeatureSettings: "'tnum'" }}>
                            Round #{r.roundId.toString()}
                          </span>
                          {/* Result badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: won ? '#fff' : refund ? 'rgba(255,255,255,0.08)' : pending ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)',
                            color: won ? '#000' : lost ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)',
                          }}>
                            {r.result}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>{r.label}</span>
                        </div>

                        {/* Numbers */}
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontFeatureSettings: "'tnum'" }}>
                          <span>Staked <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{r.amount.toFixed(4)}</strong> {balanceSymbol}</span>
                          {!pending && r.payout > 0 && (
                            <span>Payout <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{r.payout.toFixed(4)}</strong> {balanceSymbol}</span>
                          )}
                          {!pending && r.pnl !== 0 && (
                            <span style={{ color: r.pnl > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                              PnL <strong style={{ fontWeight: 600 }}>{r.pnl > 0 ? '+' : ''}{r.pnl.toFixed(4)}</strong> {balanceSymbol}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Claim action */}
                      <div style={{ flexShrink: 0 }}>
                        {r.claimable ? (
                          <button
                            className="claim-btn"
                            disabled={claimPending}
                            onClick={() => onClaim(r.roundId)}
                            style={{
                              background: '#fff',
                              color: '#000',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px 20px',
                              fontSize: 13,
                              fontWeight: 700,
                              fontFamily: 'var(--font-sans)',
                              cursor: claimPending ? 'wait' : 'pointer',
                              letterSpacing: '0.04em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {claimPending ? (
                              <>
                                <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                                Claiming…
                              </>
                            ) : '✦ Claim Payout'}
                          </button>
                        ) : won ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                            <CheckCircle size={14} /> Claimed
                          </div>
                        ) : pending ? (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Awaiting…</span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>—</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

    </div>
  );
}

// ── Sub-component: open position stat cell ────────────────────────────────────
function OpenStat({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
        {value}
        {unit && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>{unit}</span>}
      </span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>{sub}</span>}
    </div>
  );
}
