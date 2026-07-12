'use client';

import React, { useState, useRef, memo } from 'react';
import { PredictionChart } from '../PredictionChart';
import { PriceTicker } from './PriceTicker';
import { useMarket } from '@/lib/marketStore';

export const TradingPanel = memo(function TradingPanel() {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch unified context from Global Market Engine
  const {
    btcPrice,
    activeRound: round,
    activeUpPercent,
    activeDownPercent,
    timeLeftToLock,
    timeLeftToEnd,
    marketStatus,
    balanceSymbol,
    lockedEntryPrice,
    activeUserBet,
    prevRound,
    prevUserBet,
    prevMarketStatus,
  } = useMarket();

  const isCurrentRoundClosed = marketStatus === 'LOCKED' || marketStatus === 'SETTLING';
  const targetRound = isCurrentRoundClosed ? round : prevRound;
  const targetUserBet = isCurrentRoundClosed ? activeUserBet : prevUserBet;
  const liveMarketStatusStr = isCurrentRoundClosed ? marketStatus : prevMarketStatus;

  const lockTimestamp  = targetRound ? Number(targetRound.lockTimestamp)  : 0;
  const endTimestamp   = targetRound ? Number(targetRound.endTimestamp)   : 0;
  const startTimestamp = targetRound ? Number(targetRound.startTimestamp) : 0;
  const lockPriceOnChain = targetRound ? Number(targetRound.startPrice) / 1e8 : 0;
  const lockPrice = lockPriceOnChain > 0
    ? lockPriceOnChain
    : (isCurrentRoundClosed ? lockedEntryPrice : 0);
  const isLocked       = liveMarketStatusStr === 'LOCKED' || liveMarketStatusStr === 'SETTLING';
  const isResolved     = targetRound ? targetRound.resolved : false;

  const poolSize = round
    ? (Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(4)
    : '0.0000';

  // SVG lock icon for status bar
  const LockSvg = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  // Format timers
  const formatMinsSecs = (secondsTotal: number) => {
    const m = Math.floor(secondsTotal / 60).toString().padStart(2, '0');
    const s = (secondsTotal % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const lockDisplay = formatMinsSecs(timeLeftToLock);
  const endDisplay = formatMinsSecs(timeLeftToEnd);

  // Derive status badge config
  const badgeColor = isResolved
    ? 'rgba(255,255,255,0.35)'
    : timeLeftToLock > 0
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
            CONSOLIDATED ENGINE
          </span>
        </div>

        {/* Right: price + pool stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PriceTicker price={btcPrice} />
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            POOL: <strong style={{ color: '#ffffff' }}>{poolSize} {balanceSymbol}</strong>
          </span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            UP <strong style={{ color: '#ffffff' }}>{activeUpPercent.toFixed(0)}%</strong>
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            DOWN <strong style={{ color: '#ffffff' }}>{activeDownPercent.toFixed(0)}%</strong>
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
          color: badgeColor,
        }}>
          {marketStatus !== 'OPEN' && <LockSvg />}
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {marketStatus}
          </span>
        </div>

        <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Countdown to lock */}
        {timeLeftToLock > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>LOCK IN</span>
              <strong style={{
                fontSize: 12, fontFamily: 'var(--font-mono)',
                color: timeLeftToLock <= 20 ? '#ffffff' : 'rgba(255,255,255,0.7)',
                letterSpacing: '0.08em',
              }}>
                {lockDisplay}
              </strong>
            </div>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          </>
        )}

        {/* Countdown to settlement */}
        {timeLeftToEnd > 0 && (
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
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              LOCK
            </span>
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
          userPosition={targetUserBet && targetUserBet.amount > 0n ? targetUserBet.position : undefined}
          userAmount={targetUserBet && targetUserBet.amount > 0n ? Number(targetUserBet.amount) / 1e18 : undefined}
          balanceSymbol={balanceSymbol}
        />
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
