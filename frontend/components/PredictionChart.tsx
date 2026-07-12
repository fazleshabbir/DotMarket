'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi, Time, LineStyle } from 'lightweight-charts';

interface PredictionChartProps {
  lockPrice?: number;          // 0 if betting still open
  roundStartTime?: number;     // unix seconds
  roundEndTime?: number;       // unix seconds (settlement)
  roundLockTime?: number;      // unix seconds (betting closes)
  btcPrice: number;            // live price from parent
  isLocked?: boolean;
  isResolved?: boolean;
  userPosition?: number;       // 0 for UP, 1 for DOWN, undefined if none
  userAmount?: number;         // bet amount in USDC
  balanceSymbol?: string;      // USDC
}

interface KlinePoint {
  time: Time;
  value: number;
}

// All chart data is sourced from Pyth Hermes (same as the live market panels)
// No Binance klines — this eliminates the $5-10 price spread between price sources

export const PredictionChart = memo(function PredictionChart({
  lockPrice = 0,
  roundStartTime = 0,
  roundEndTime = 0,
  roundLockTime = 0,
  btcPrice,
  isLocked = false,
  isResolved = false,
  userPosition,
  userAmount,
  balanceSymbol,
}: PredictionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area', Time> | null>(null);
  const liveDotRef = useRef<HTMLDivElement>(null);
  const pricePillRef = useRef<HTMLDivElement>(null);
  const lockLineRef = useRef<HTMLDivElement>(null);
  const lockPillRef = useRef<HTMLDivElement>(null);
  const lockVerticalLineRef = useRef<HTMLDivElement>(null);
  const endVerticalLineRef = useRef<HTMLDivElement>(null);
  const latestPrice = useRef<number>(btcPrice);
  const updateDotAndPillRef = useRef<((price: number) => void) | null>(null);
  const [chartReady, setChartReady] = useState(false);

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [phaseLabel, setPhaseLabel] = useState<string>('');

  // ── Chart initialization ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: 'rgba(255, 255, 255, 0.3)',
        fontFamily: "'Inter', 'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255, 255, 255, 0.12)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#111111',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.12)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#111111',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        textColor: 'rgba(255, 255, 255, 0.3)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          const hh = d.getHours().toString().padStart(2, '0');
          const mm = d.getMinutes().toString().padStart(2, '0');
          const ss = d.getSeconds().toString().padStart(2, '0');
          return `${hh}:${mm}:${ss}`;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: 'rgba(255, 255, 255, 0.9)',
      lineWidth: 2,
      topColor: 'rgba(255, 255, 255, 0.06)',
      bottomColor: 'rgba(255, 255, 255, 0.00)',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#ffffff',
      crosshairMarkerBackgroundColor: '#000000',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    // Seed the chart with the current Pyth price (no Binance data — eliminates price source mismatch)
    fetch('https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', {
      signal: AbortSignal.timeout(5000)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.parsed && data.parsed[0]) {
          const priceStr = data.parsed[0].price.price;
          const expo = data.parsed[0].price.expo;
          const seedPrice = Number(priceStr) * Math.pow(10, expo);
          const nowSec = Math.floor(Date.now() / 1000);

          // Create 120 seconds of flat seed data so the chart has initial scale context
          if (seriesRef.current) {
            const seedPoints: KlinePoint[] = [];
            for (let i = 120; i >= 0; i--) {
              seedPoints.push({ time: (nowSec - i) as Time, value: seedPrice });
            }
            seriesRef.current.setData(seedPoints);
            latestPrice.current = seedPrice;
            chart.timeScale().fitContent();
          }
        }
        setChartReady(true);
      })
      .catch(() => {
        setChartReady(true);
      });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ── Update live dot and price pill positions ────────────────────────────────
  const updateDotAndPill = useCallback((price: number) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;
    if (!chart || !series || !container) return;

    // Get coordinate of latest time
    const timeScale = chart.timeScale();
    const now = Math.floor(Date.now() / 1000) as Time;
    const x = timeScale.timeToCoordinate(now);
    const y = series.priceToCoordinate(price);

    if (x !== null && y !== null) {
      if (liveDotRef.current) {
        liveDotRef.current.style.left = `${x - 6}px`;
        liveDotRef.current.style.top = `${y - 6}px`;
        liveDotRef.current.style.opacity = '1';
      }
      if (pricePillRef.current) {
        pricePillRef.current.style.top = `${y - 14}px`;
        pricePillRef.current.style.opacity = '1';
        pricePillRef.current.textContent = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    // Dynamic P&L Color Shift (Monochrome high-contrast design)
    const hasBet = lockPrice > 0 && userPosition !== undefined;
    if (hasBet && series) {
      const isUp = userPosition === 0;
      const isWinning = isUp ? price > lockPrice : price < lockPrice;
      
      if (isWinning) {
        series.applyOptions({
          lineColor: 'rgba(255, 255, 255, 0.95)',
          topColor: 'rgba(255, 255, 255, 0.15)',
          bottomColor: 'rgba(255, 255, 255, 0.00)',
        });
      } else {
        series.applyOptions({
          lineColor: 'rgba(255, 255, 255, 0.35)',
          topColor: 'rgba(255, 255, 255, 0.02)',
          bottomColor: 'rgba(255, 255, 255, 0.00)',
        });
      }
    } else if (series) {
      // Default styles when no active bet
      series.applyOptions({
        lineColor: 'rgba(255, 255, 255, 0.8)',
        topColor: 'rgba(255, 255, 255, 0.06)',
        bottomColor: 'rgba(255, 255, 255, 0.00)',
      });
    }

    // Update lock line position
    if (lockPrice > 0 && lockLineRef.current && lockPillRef.current) {
      const lockY = series.priceToCoordinate(lockPrice);
      if (lockY !== null) {
        lockLineRef.current.style.top = `${lockY}px`;
        lockLineRef.current.style.opacity = '1';
        lockPillRef.current.style.top = `${lockY - 11}px`;
        lockPillRef.current.style.opacity = '1';
      }
    }

    // Update vertical phase line positions
    if (roundLockTime > 0 && lockVerticalLineRef.current) {
      const lockX = timeScale.timeToCoordinate(roundLockTime as Time);
      if (lockX !== null && lockX >= 0 && lockX <= container.clientWidth) {
        lockVerticalLineRef.current.style.left = `${lockX}px`;
        lockVerticalLineRef.current.style.opacity = '1';
      } else {
        lockVerticalLineRef.current.style.opacity = '0';
      }
    }
    if (roundEndTime > 0 && endVerticalLineRef.current) {
      const endX = timeScale.timeToCoordinate(roundEndTime as Time);
      if (endX !== null && endX >= 0 && endX <= container.clientWidth) {
        endVerticalLineRef.current.style.left = `${endX}px`;
        endVerticalLineRef.current.style.opacity = '1';
      } else {
        endVerticalLineRef.current.style.opacity = '0';
      }
    }
  }, [lockPrice, userPosition, roundLockTime, roundEndTime]);

  useEffect(() => {
    updateDotAndPillRef.current = updateDotAndPill;
  }, [updateDotAndPill]);

  // Live HUD Phase Countdown calculations
  useEffect(() => {
    const timer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (isResolved) {
        setTimeLeft('');
        setPhaseLabel('RESOLVED');
        return;
      }
      if (!isLocked && roundLockTime > nowSec) {
        const diff = roundLockTime - nowSec;
        const mm = Math.floor(diff / 60);
        const ss = diff % 60;
        setTimeLeft(`${mm}:${ss.toString().padStart(2, '0')}`);
        setPhaseLabel('LOCKING');
      } else if (isLocked && roundEndTime > nowSec) {
        const diff = roundEndTime - nowSec;
        const mm = Math.floor(diff / 60);
        const ss = diff % 60;
        setTimeLeft(`${mm}:${ss.toString().padStart(2, '0')}`);
        setPhaseLabel('SETTLING');
      } else {
        setTimeLeft('');
        setPhaseLabel('WAITING');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roundLockTime, roundEndTime, isLocked, isResolved]);

  // Update series and overlays whenever btcPrice prop changes from parent polling
  useEffect(() => {
    if (!chartReady || !seriesRef.current || btcPrice <= 0) return;

    // Spike protection: reject any price update that jumps more than $100 from the last known price
    const lastKnown = latestPrice.current;
    if (lastKnown > 0 && Math.abs(btcPrice - lastKnown) > 100) {
      return; // Skip this tick — likely a bad data point
    }

    const nowTime = Math.floor(Date.now() / 1000) as Time;
    const point: KlinePoint = { time: nowTime, value: btcPrice };
    seriesRef.current.update(point);
    latestPrice.current = btcPrice;
    updateDotAndPill(btcPrice);
  }, [btcPrice, chartReady, updateDotAndPill]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Lightweight Charts canvas container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}
      />

      {/* ── Live dot overlay ── */}
      <div
        ref={liveDotRef}
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 0 0 4px rgba(255,255,255,0.12), 0 0 16px rgba(255,255,255,0.25)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'left 0.4s ease, top 0.4s ease',
          animation: 'liveDotPulse 2s ease-in-out infinite',
        }}
      />

      {/* ── Current price pill ── */}
      <div
        ref={pricePillRef}
        style={{
          position: 'absolute',
          right: 4,
          padding: '3px 10px',
          borderRadius: 20,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 12px rgba(255,255,255,0.06)',
          transition: 'top 0.4s ease',
          whiteSpace: 'nowrap',
        }}
      />

      {/* ── Lock price horizontal line ── */}
      {lockPrice > 0 && (
        <>
          <div
            ref={lockLineRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 52,
              height: 0,
              borderTop: userPosition !== undefined ? '1px dashed rgba(255, 255, 255, 0.75)' : '1px dashed rgba(255, 255, 255, 0.3)',
              boxShadow: userPosition !== undefined ? '0 0 10px rgba(255, 255, 255, 0.15)' : 'none',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 9,
              transition: 'top 0.4s ease',
            }}
          />
          <div
            ref={lockPillRef}
            style={{
              position: 'absolute',
              left: 8,
              padding: userPosition !== undefined ? '3px 10px' : '2px 8px',
              borderRadius: 8,
              background: userPosition !== undefined ? '#ffffff' : 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              border: userPosition !== undefined ? 'none' : '1px solid rgba(255,255,255,0.12)',
              color: userPosition !== undefined ? '#000000' : '#ffffff',
              fontSize: 9,
              fontFamily: userPosition !== undefined ? 'var(--font-sans)' : 'var(--font-mono)',
              fontWeight: userPosition !== undefined ? 800 : 700,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
              transition: 'top 0.4s ease',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: userPosition !== undefined ? '0 4px 12px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            {userPosition !== undefined ? (
              <>
                {userPosition === 0 ? '▲ UP' : '▼ DOWN'} POSITION &nbsp;
                <strong>
                  ${lockPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </>
            ) : (
              <>
                🔒 Lock&nbsp;
                <strong>
                  ${lockPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Active Bet Status HUD Overlay ── */}
      {userPosition !== undefined && userAmount !== undefined && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 11,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ffffff',
              animation: 'liveDotPulse 2s ease-in-out infinite'
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)' }}>
              ACTIVE POSITION
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-sans)' }}>
              {userPosition === 0 ? '▲ UP' : '▼ DOWN'}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'var(--font-mono)' }}>
              {userAmount.toFixed(2)} {balanceSymbol}
            </span>
          </div>
          {/* Live P&L estimate display */}
          {(() => {
            const lastVal = latestPrice.current;
            if (lockPrice > 0 && lastVal > 0) {
              const isUp = userPosition === 0;
              const isWinning = isUp ? lastVal > lockPrice : lastVal < lockPrice;
              const diff = Math.abs(lastVal - lockPrice);
              return (
                <div style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: isWinning ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: isWinning ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    {isWinning ? 'BULLISH' : 'BEARISH'}
                  </span>
                  <span>{isWinning ? '+' : '-'}${diff.toFixed(2)}</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ── Live Phase Countdown HUD Overlay ── */}
      {phaseLabel && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: phaseLabel === 'SETTLING' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
          }}>
            {phaseLabel}
          </span>
          {timeLeft && (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
            }}>
              {timeLeft}
            </span>
          )}
        </div>
      )}

      {/* ── Lock phase vertical marker line ── */}
      <div
        ref={lockVerticalLineRef}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 0,
          borderLeft: '1px dashed rgba(255, 255, 255, 0.2)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'left 0.4s ease',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 6,
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4,
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em'
        }}>
          LOCK
        </div>
      </div>

      {/* ── Settlement phase vertical marker line ── */}
      <div
        ref={endVerticalLineRef}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 0,
          borderLeft: '1px dashed rgba(255, 255, 255, 0.12)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'left 0.4s ease',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 6,
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4,
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.35)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em'
        }}>
          SETTLE
        </div>
      </div>

      {/* ── Prediction zone column overlays ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          pointerEvents: 'none',
          zIndex: 4,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Previous zone */}
        <div style={{ flex: 1, borderRight: '1px dashed rgba(255,255,255,0.05)', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            fontSize: 9, fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em'
          }}>
            ← PREV ROUND
          </div>
        </div>

        {/* Active zone */}
        <div style={{
          flex: 1.4,
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.005)',
          position: 'relative',
          animation: 'breatheZone 5s ease-in-out infinite',
        }}>
          {/* Top glow bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
          }} />
          <div style={{
            position: 'absolute', bottom: 8, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5
          }}>
            <span style={{
              width: 4, height: 4, borderRadius: '50%', background: '#ffffff',
              animation: 'liveDotPulse 2s ease-in-out infinite', display: 'inline-block'
            }} />
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', fontWeight: 700
            }}>
              LIVE MARKET
            </span>
          </div>
        </div>

        {/* Next zone */}
        <div style={{ flex: 1, borderLeft: '1px dashed rgba(255,255,255,0.05)', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontSize: 9, fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em'
          }}>
            NEXT ROUND →
          </div>
        </div>
      </div>

      {/* ── Keyframe style block ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes liveDotPulse {
          0%   { box-shadow: 0 0 0 0px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.2); }
          50%  { box-shadow: 0 0 0 6px rgba(255,255,255,0.05), 0 0 20px rgba(255,255,255,0.15); }
          100% { box-shadow: 0 0 0 0px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.2); }
        }
        @keyframes breatheZone {
          0%   { background: rgba(255,255,255,0.005); }
          50%  { background: rgba(255,255,255,0.015); }
          100% { background: rgba(255,255,255,0.005); }
        }
      ` }} />
    </div>
  );
});

PredictionChart.displayName = 'PredictionChart';
