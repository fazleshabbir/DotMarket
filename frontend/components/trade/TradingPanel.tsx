'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { PredictionChart } from '../PredictionChart';
import { PriceTicker } from './PriceTicker';

interface TradingPanelProps {
  btcPrice: number;
  round: any;
  activeUpPercent: number;
  activeDownPercent: number;
}

function useCountdown(targetUnix: number) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, targetUnix - now);
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');
  return { timeLeft: left, display: `${m}:${s}` };
}

export const TradingPanel = memo(function TradingPanel({
  btcPrice,
  round,
  activeUpPercent,
  activeDownPercent,
}: TradingPanelProps) {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lockTimestamp  = round ? Number(round.lockTimestamp)  : 0;
  const endTimestamp   = round ? Number(round.endTimestamp)   : 0;
  const startTimestamp = round ? Number(round.startTimestamp) : 0;
  const lockPrice      = round ? Number(round.startPrice) / 1e8 : 0;
  const isLocked       = round?.locked ?? false;
  const isResolved     = round?.resolved ?? false;

  const { timeLeft: lockLeft,  display: lockDisplay  } = useCountdown(lockTimestamp);
  const { timeLeft: endLeft,   display: endDisplay   } = useCountdown(endTimestamp);

  const poolSize = round
    ? (Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(2)
    : '0.00';

  // Derive market phase label
  const phase = isResolved
    ? '✓ Settled'
    : lockLeft > 0
      ? '● Betting Open'
      : '🔒 Locked';

  const phaseColor = isResolved
    ? 'rgba(255,255,255,0.35)'
    : lockLeft > 0
      ? '#ffffff'
      : 'rgba(255,255,255,0.6)';

  const handleToggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={chartWrapperRef}
      className="premium-card"
      style={{
        height: '100%',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Left: Symbol + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
            BTC/USD
          </span>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span className="animate-pulse-live" style={{
              width: 5, height: 5, borderRadius: '50%', background: '#ffffff', display: 'inline-block'
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff', letterSpacing: '0.1em' }}>LIVE</span>
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            2 MINUTE MARKET
          </span>
        </div>

        {/* Right: price + pool stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PriceTicker price={btcPrice} />
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            POOL: <strong style={{ color: '#ffffff' }}>{poolSize} ETH</strong>
          </span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            YES <strong style={{ color: '#ffffff' }}>{activeUpPercent.toFixed(0)}%</strong>
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            NO <strong style={{ color: '#ffffff' }}>{activeDownPercent.toFixed(0)}%</strong>
          </span>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
              borderRadius: 6, padding: '3px 7px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Market Status Bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '6px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.01)',
        flexShrink: 0,
        flexWrap: 'nowrap',
        overflowX: 'auto',
      }}>
        {/* Phase badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: phaseColor, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {phase}
          </span>
        </div>

        <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Countdown to lock */}
        {lockLeft > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>LOCK IN</span>
              <strong style={{
                fontSize: 12, fontFamily: 'var(--font-mono)',
                color: lockLeft <= 20 ? '#ffffff' : 'rgba(255,255,255,0.7)',
                letterSpacing: '0.08em',
              }}>
                {lockDisplay}
              </strong>
            </div>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          </>
        )}

        {/* Countdown to settlement */}
        {endLeft > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>SETTLEMENT</span>
            <strong style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              {endDisplay}
            </strong>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {/* Lock price chip */}
        {lockPrice > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>🔒 LOCK</span>
            <strong style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              ${lockPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>
        )}
      </div>

      {/* ── Prediction Chart ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <PredictionChart
          btcPrice={btcPrice}
          lockPrice={lockPrice > 0 ? lockPrice : undefined}
          roundStartTime={startTimestamp}
          roundEndTime={endTimestamp}
          roundLockTime={lockTimestamp}
          isLocked={isLocked}
          isResolved={isResolved}
        />
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
