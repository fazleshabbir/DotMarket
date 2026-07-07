'use client';

import React, { useEffect, useRef } from 'react';

export function TradingViewChart() {
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
        interval: '1',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1', // Candlestick style
        locale: 'en',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: 'https://www.tradingview.com',
        backgroundColor: '#000000',
        gridColor: 'rgba(255, 255, 255, 0.03)',
      });
      container.current.innerHTML = '';
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ 
        height: '420px', 
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: '#000000',
      }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
}
