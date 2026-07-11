'use client';

import React, { useState, useRef, memo } from 'react';
import { TradingViewChart } from '../TradingViewChart';
import { PositionsTable } from '../PositionsTable';
import { PriceTicker } from './PriceTicker';

interface TradingPanelProps {
  btcPrice: number;
  round: any;
  activeUpPercent: number;
  activeDownPercent: number;
}

export const TradingPanel = memo(function TradingPanel({
  btcPrice,
  round,
  activeUpPercent,
  activeDownPercent,
}: TradingPanelProps) {
  const [interval, setInterval] = useState('1');
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1H', value: '60' },
    { label: '1D', value: 'D' },
  ];

  const handleToggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleResetZoom = () => {
    // Recreate chart widget to reset zoom
    const currentInterval = interval;
    setInterval('');
    setTimeout(() => {
      setInterval(currentInterval);
    }, 50);
  };

  const poolSize = round ? (Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Native-feel Chart Wrap element (65% height) */}
      <div
        ref={chartWrapperRef}
        className="premium-card"
        style={{
          height: '65%',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Custom DotMarket Chart Live Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            paddingBottom: '8px',
            flexShrink: 0,
          }}
        >
          {/* Live Market Price & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
              BTC/USD
            </span>

            {/* Pulsing Live badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="animate-pulse-live"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>
                LIVE
              </span>
            </div>

            {/* Price updates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PriceTicker price={btcPrice} />
              <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>
                ▲ +0.23%
              </span>
            </div>
          </div>

          {/* Pool details and layout tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Stats strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>POOL: {poolSize} ETH</span>
              <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <span>YES {activeUpPercent.toFixed(0)}%</span>
              <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <span>{activeDownPercent.toFixed(0)}% NO</span>
            </div>

            <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ROBINHOOD TESTNET
            </span>
          </div>
        </div>

        {/* Custom Toolbar element */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {/* Timeframe pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {timeframes.map((tf) => {
              const active = tf.value === interval;
              return (
                <button
                  key={tf.label}
                  onClick={() => setInterval(tf.value)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                    color: active ? '#000000' : 'var(--text-secondary)',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    borderColor: active ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 150ms ease',
                  }}
                  className="timeframe-pill-btn"
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Indicators reset / fullscreen */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Reset Zoom Button */}
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dynamic widget container (reloads ONLY when interval changes) */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {interval && <TradingViewChart interval={interval} />}
        </div>
      </div>

      {/* Positions & Claim Logs Table (35% height) */}
      <div style={{ height: '35%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <PositionsTable />
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
