'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  interval?: string; // TV intervals: '1', '5', '15', '60', 'D', etc.
}

export const TradingViewChart = memo(function TradingViewChart({ interval = '1' }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && container.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: 'BINANCE:BTCUSDT',
        interval: interval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1', // Candlestick style
        locale: 'en',
        enable_publishing: false,
        hide_side_toolbar: true, // Hide side drawing panel
        hide_top_toolbar: true, // Hide TV native top header
        saveimage: false, // Hide TV screenshot button
        calendar: false,
        support_host: 'https://www.tradingview.com',
        backgroundColor: '#000000',
        gridColor: 'rgba(255, 255, 255, 0.01)', // Faint grid lines to match custom backdrop grid
        withdateranges: true,
        hide_volume: false,
      });
      container.current.innerHTML = '';
      container.current.appendChild(script);
    }
  }, [interval]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        background: '#000000',
      }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
