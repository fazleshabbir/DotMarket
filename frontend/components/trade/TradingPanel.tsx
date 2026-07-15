'use client';

import React, { useState, useRef, memo } from 'react';
import { PredictionChart } from '../PredictionChart';
import { PriceTicker } from './PriceTicker';
import { useMarket } from '@/lib/marketStore';
import { LockIcon } from '../ui/LockIcon';

export const TradingPanel = memo(function TradingPanel() {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch unified context from Global Market Engine
  const {
    btcPrice,
    activeRound: round,
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
      {/* ── Minimal Chart Header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-2)',
        background: 'rgba(255, 255, 255, 0.01)',
        flexShrink: 0,
        height: 38,
        boxSizing: 'border-box',
      }}>
        {/* Left: Chart Title + Lock Price if present */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.04em' }}>
            PREDICTION CHART
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            CONSOLIDATED ENGINE
          </span>
          {lockPrice > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-2)',
            }}>
              <LockIcon size={9} style={{ opacity: 0.8, color: 'var(--text-2)' }} />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>LOCK</span>
              <strong style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                ${lockPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          )}
        </div>

        {/* Right: Fullscreen Toggle */}
        <button
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-2)',
            color: 'var(--text-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
          </svg>
        </button>
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
