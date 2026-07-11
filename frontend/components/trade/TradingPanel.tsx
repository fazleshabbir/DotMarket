'use client';

import React, { memo } from 'react';
import { TradingViewChart } from '../TradingViewChart';
import { PositionsTable } from '../PositionsTable';

export const TradingPanel = memo(function TradingPanel() {
  return (
    <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 500 }}>
      {/* Chart container with premium glass framing */}
      <div
        className="premium-card"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>
            BTC-USD LIVE INDEX CHART
          </strong>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            1M INTERVAL
          </span>
        </div>
        <TradingViewChart />
      </div>

      {/* Positions & Claim Logs Table */}
      <PositionsTable />
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';
