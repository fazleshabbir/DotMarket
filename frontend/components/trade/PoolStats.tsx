'use client';

import React, { memo } from 'react';

interface PoolStatsProps {
  totalPool: string;
  upAmount: string;
  downAmount: string;
  upMultiplier?: number;
  downMultiplier?: number;
}

export const PoolStats = memo(function PoolStats({
  totalPool,
  upAmount,
  downAmount,
  upMultiplier = 0,
  downMultiplier = 0,
}: PoolStatsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        width: '100%',
      }}
    >
      {/* Pool and Payout breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>TOTAL POOL SIZE</span>
        <strong style={{ fontSize: 13, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          {totalPool} USDC
        </strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>UP MULTIPLIER</span>
          <strong style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {upMultiplier > 0 ? `${upMultiplier.toFixed(2)}x` : '—'}
          </strong>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {upAmount} USDC
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>DOWN MULTIPLIER</span>
          <strong style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {downMultiplier > 0 ? `${downMultiplier.toFixed(2)}x` : '—'}
          </strong>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {downAmount} USDC
          </span>
        </div>
      </div>
    </div>
  );
});

PoolStats.displayName = 'PoolStats';
