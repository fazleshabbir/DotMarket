'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi, Time, LineStyle } from 'lightweight-charts';

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

interface PredictionChartProps {
  btcPrice: number;            // live price from parent
  activeBets?: Bet[];
}

interface KlinePoint {
  time: Time;
  value: number;
}

// Fetch recent 1-second klines from Binance REST
async function fetchKlines(limit = 300): Promise<KlinePoint[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1s&limit=${limit}`
    );
    const data: any[][] = await res.json();
    const seen = new Map<number, number>();
    for (const k of data) {
      const t = Math.floor(k[0] / 1000);
      seen.set(t, parseFloat(k[4]));
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([t, v]) => ({ time: t as Time, value: v }));
  } catch {
    return [];
  }
}

export const PredictionChart = memo(function PredictionChart({
  btcPrice,
  activeBets = [],
}: PredictionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area', Time> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const liveDotRef = useRef<HTMLDivElement>(null);
  const pricePillRef = useRef<HTMLDivElement>(null);
  const activePriceLinesRef = useRef<any[]>([]);
  const latestPrice = useRef<number>(btcPrice);
  const updateDotAndPillRef = useRef<((price: number) => void) | null>(null);
  const [chartReady, setChartReady] = useState(false);

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

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    fetchKlines(300).then((points) => {
      if (seriesRef.current && points.length > 0) {
        seriesRef.current.setData(points);
        chart.timeScale().fitContent();
        setChartReady(true);
      } else {
        setChartReady(true);
      }
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
  }, []);

  useEffect(() => {
    updateDotAndPillRef.current = updateDotAndPill;
  }, [updateDotAndPill]);

  // ── Live aggTrade WebSocket ──
  useEffect(() => {
    if (!chartReady) return;

    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade');
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const price = parseFloat(msg.p);
        const t = Math.floor(msg.T / 1000) as Time;
        const point: KlinePoint = { time: t, value: price };
        seriesRef.current?.update(point);
        latestPrice.current = price;
        updateDotAndPillRef.current?.(price);
      } catch {}
    };

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [chartReady]);

  // Update overlays whenever btcPrice prop changes from parent polling
  useEffect(() => {
    updateDotAndPill(btcPrice);
  }, [btcPrice, updateDotAndPill]);

  // ── Draw Price Lines for Active Bets ──
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove old price lines
    activePriceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    activePriceLinesRef.current = [];

    // Add new price lines
    activeBets.forEach((bet) => {
      const price = Number(bet.entryPrice) / 1e8;
      const isUp = bet.position === 0;
      const line = series.createPriceLine({
        price,
        color: isUp ? '#ffffff' : 'rgba(255,255,255,0.45)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${isUp ? '▲ UP' : '▼ DOWN'} (Bet #${bet.betId})`,
      });
      activePriceLinesRef.current.push(line);
    });
  }, [activeBets]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

      {/* ── Keyframe style block ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes liveDotPulse {
          0%   { box-shadow: 0 0 0 0px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.2); }
          50%  { box-shadow: 0 0 0 6px rgba(255,255,255,0.05), 0 0 20px rgba(255,255,255,0.15); }
          100% { box-shadow: 0 0 0 0px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.2); }
        }
      ` }} />
    </div>
  );
});

PredictionChart.displayName = 'PredictionChart';
