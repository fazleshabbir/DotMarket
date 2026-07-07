'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, AreaSeries, type IChartApi, type ISeriesApi, type AreaSeriesOptions, type DeepPartial } from 'lightweight-charts';

/**
 * Generate simulated BTC-like price data for demo purposes.
 * In production, connect to Pyth Hermes WebSocket for real-time data:
 *   const ws = new WebSocket('wss://hermes.pyth.network/ws');
 *   ws.send(JSON.stringify({ type: 'subscribe', ids: [PRICE_FEED_ID] }));
 */
function generateDemoData() {
  const data = [];
  let price = 65000 + Math.random() * 2000;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 3600; // last hour

  for (let i = 0; i < 360; i++) {
    const time = startTime + i * 10;
    price += (Math.random() - 0.48) * 50; // slight upward bias
    price = Math.max(62000, Math.min(70000, price));
    data.push({ time, value: Math.round(price * 100) / 100 });
  }
  return data;
}

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.06)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.06)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: 2 },
        horzLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const seriesOptions: DeepPartial<AreaSeriesOptions> = {
      lineColor: '#ffffff',
      lineWidth: 2,
      topColor: 'rgba(255, 255, 255, 0.15)',
      bottomColor: 'rgba(255, 255, 255, 0.0)',
      crosshairMarkerBackgroundColor: '#ffffff',
      crosshairMarkerBorderColor: '#ffffff',
      crosshairMarkerRadius: 5,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    };

    const series = chart.addSeries(AreaSeries, seriesOptions);
    const data = generateDemoData();
    series.setData(data as any);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    // Simulate live price updates
    let lastPrice = data[data.length - 1].value;
    let lastTime = data[data.length - 1].time as number;

    intervalRef.current = setInterval(() => {
      lastPrice += (Math.random() - 0.48) * 30;
      lastPrice = Math.max(62000, Math.min(70000, lastPrice));
      lastTime += 10;
      const point = { time: lastTime, value: Math.round(lastPrice * 100) / 100 };
      series.update(point as any);
    }, 3000);
  }, []);

  useEffect(() => {
    initChart();

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  return (
    <div
      className="glass-card"
      style={{
        height: '100%',
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Chart Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>BTC/USD</span>
          <span
            className="animate-pulse-live"
            style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--up-dim)',
              color: 'var(--up)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            LIVE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['2m', '3m', '5m', '10m'].map((tf) => (
            <button
              key={tf}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                cursor: 'pointer',
                background: tf === '2m' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: tf === '2m' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: tf === '2m' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
