'use client';

import React, { useState, useRef, memo } from 'react';
import { PredictionChart } from '../PredictionChart';
import { PriceTicker } from './PriceTicker';

interface Bet {
  betId: bigint;
  user: string;
  position: number; // 0 = UP, 1 = DOWN
  stake: bigint;
  entryTime: bigint;
  expiryTime: bigint;
  entryPrice: bigint;
  settlementPrice: bigint;
  lockedMultiplier: bigint;
  status: number; // 0 = Running, 1 = Won, 2 = Lost, 3 = Push
  payout: bigint;
  claimed: boolean;
}

interface TradingPanelProps {
  btcPrice: number;
  activeBets?: Bet[];
  activeTotalPool: bigint;
  activeUpPercent: number;
  activeDownPercent: number;
}

export const TradingPanel = memo(function TradingPanel({
  btcPrice,
  activeBets = [],
  activeTotalPool,
  activeUpPercent,
  activeDownPercent,
}: TradingPanelProps) {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const poolSize = (Number(activeTotalPool) / 1e18).toFixed(2);

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
      {/* ── Top Header ── */}
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
            60 SECOND MARKET
          </span>
        </div>

        {/* Right: price + pool stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PriceTicker price={btcPrice} />
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            ACTIVE POOL: <strong style={{ color: '#ffffff' }}>{poolSize} USDC</strong>
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
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Chart Area ── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <PredictionChart btcPrice={btcPrice} activeBets={activeBets} />
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
