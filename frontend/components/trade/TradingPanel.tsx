'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { TradingViewChart } from '../TradingViewChart';
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
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    const currentInterval = interval;
    setInterval('');
    setTimeout(() => {
      setInterval(currentInterval);
    }, 50);
  };

  const poolSize = round ? (Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(2) : '0.00';

  // Math conversions for prediction offsets
  const lockPrice = round ? Number(round.startPrice) / 1e8 : 0;
  const priceDiff = btcPrice - lockPrice;
  const percentDiff = lockPrice > 0 ? (priceDiff / lockPrice) * 100 : 0;
  // Clamp pixel offsets safely to keep overlays in visible viewport boundaries
  const offsetPx = Math.max(-130, Math.min(130, percentDiff * 25000));
  const isAbove = priceDiff >= 0;

  const lockTimestamp = round ? Number(round.lockTimestamp) : 0;
  const timeLeft = Math.max(0, lockTimestamp - now);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 20 && timeLeft > 0;

  return (
    <div
      ref={chartWrapperRef}
      className="premium-card"
      style={{
        height: '100%',
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

          {/* Toggle Fullscreen Button */}
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

      {/* Dynamic widget container */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes breathingHighlight {
            0% { background-color: rgba(255, 255, 255, 0.015); }
            50% { background-color: rgba(255, 255, 255, 0.035); }
            100% { background-color: rgba(255, 255, 255, 0.015); }
          }
          .breathing-active-zone {
            animation: breathingHighlight 4s ease-in-out infinite;
          }
          @media (max-width: 1200px) {
            .hide-tablet {
              display: none !important;
            }
          }
        ` }} />

        {interval && <TradingViewChart interval={interval} />}

        {/* Non-blocking 2-minute round timeline guides overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            zIndex: 5,
          }}
        >
          {/* Previous Prediction Zone (Left Column) */}
          <div
            style={{
              flex: 1,
              borderRight: '1px dashed rgba(255, 255, 255, 0.08)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="hide-tablet"
              style={{
                padding: '8px 12px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                opacity: 0.4,
                letterSpacing: '0.08em',
              }}
            >
              ← Previous Prediction
            </div>
          </div>

          {/* Active Prediction Zone (Middle Column) */}
          <div
            className="breathing-active-zone"
            style={{
              flex: 1.5,
              borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {/* Top soft glow bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
              }}
            />
            
            {/* Labels at top of active prediction round */}
            <div
              style={{
                padding: '8px 12px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'center',
              }}
            >
              <span
                className="animate-pulse-live"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
              ● Active Prediction
            </div>

            {/* Vertical boundaries start & settlement icons */}
            {/* Start Flag Badge (Left Divider) */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#ffffff',
                zIndex: 7,
              }}
              title="Prediction Round Start"
            >
              🏁
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                left: 6,
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              Start
            </div>

            {/* Settlement Flag Badge (Right Divider) */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 0,
                transform: 'translateX(50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#ffffff',
                zIndex: 7,
              }}
              title="Round Settlement"
            >
              🏁
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                right: 6,
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              Settlement
            </div>

            {/* Locked Price guide and Horizontal Line */}
            {lockPrice > 0 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.25)',
                    zIndex: 4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 'calc(50% - 10px)',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: 8,
                    fontFamily: 'var(--font-mono)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    zIndex: 5,
                  }}
                >
                  <span>🔒 Lock Price</span>
                  <strong>{lockPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>

                {/* Connecting price path guides line */}
                <div
                  style={{
                    position: 'absolute',
                    right: 48,
                    top: offsetPx >= 0 ? `calc(50% - ${offsetPx}px)` : '50%',
                    height: Math.abs(offsetPx),
                    width: 1,
                    borderLeft: '1px dashed rgba(255, 255, 255, 0.15)',
                    zIndex: 4,
                    transition: 'top 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                />
              </>
            )}

            {/* Current Price floating pill tracking offsets */}
            <div
              style={{
                position: 'absolute',
                right: 8,
                top: `calc(50% - ${offsetPx}px - 14px)`,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.8), 0 0 12px rgba(255,255,255,0.05)',
                zIndex: 6,
                transition: 'top 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            >
              <span
                className="animate-pulse-live"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
              <span>Current Price</span>
              <strong>${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>

            {/* Directional hint */}
            {lockPrice > 0 && (
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: `calc(50% - ${offsetPx}px + 14px)`,
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: isAbove ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  zIndex: 6,
                  transition: 'top 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                {isAbove ? '▲ Above Lock Price' : '▼ Below Lock Price'}
              </div>
            )}

            {/* Floating countdown remaining timer */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: isLowTime ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isLowTime ? 700 : 500,
                zIndex: 6,
                boxShadow: isLowTime ? '0 0 10px rgba(255,255,255,0.06)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              ⏱ {timeLeft > 0 ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Remaining` : 'Closed'}
            </div>
          </div>

          {/* Next Prediction Zone (Right Column) */}
          <div
            style={{
              flex: 1,
              borderLeft: '1px dashed rgba(255, 255, 255, 0.08)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="hide-tablet"
              style={{
                padding: '8px 12px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                opacity: 0.4,
                textAlign: 'right',
                letterSpacing: '0.08em',
              }}
            >
              Next Prediction →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
