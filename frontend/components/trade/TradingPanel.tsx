'use client';

import React, { memo } from 'react';
import { TradingViewChart } from '../TradingViewChart';
import { PositionsTable } from '../PositionsTable';

export const TradingPanel = memo(function TradingPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Chart container with premium glass framing (65% height) */}
      <div
        className="premium-card"
        style={{
          height: '65%',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <strong style={{ fontSize: 12, color: '#ffffff', letterSpacing: '0.08em' }}>
            BTC-USD LIVE INDEX CHART
          </strong>
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            1M INTERVAL
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <TradingViewChart />
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
