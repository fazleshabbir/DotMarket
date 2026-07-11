'use client';

import React, { memo } from 'react';

interface ProgressBarProps {
  upPercent: number;
  downPercent: number;
  upLabel?: string;
  downLabel?: string;
}

export const ProgressBar = memo(function ProgressBar({
  upPercent,
  downPercent,
  upLabel = 'UP',
  downLabel = 'DOWN',
}: ProgressBarProps) {
  // Safe boundaries
  const total = upPercent + downPercent;
  const normalizedUp = total > 0 ? (upPercent / total) * 100 : 50;
  const normalizedDown = 100 - normalizedUp;

  return (
    <div style={{ width: '100%', margin: '16px 0' }}>
      {/* Percentage labels aligned */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {upLabel} {normalizedUp.toFixed(1)}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {normalizedDown.toFixed(1)}% {downLabel}
        </span>
      </div>

      {/* Premium visual bar container */}
      <div
        style={{
          height: 6,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'relative',
          display: 'flex',
          gap: 1,
        }}
      >
        {/* UP portion: pure white */}
        <div
          style={{
            width: `${normalizedUp}%`,
            height: '100%',
            background: '#ffffff',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle moving shine indicator */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)',
              transform: 'skewX(-20deg) translateX(-100%)',
              animation: 'shine-slide-slow 3s infinite ease-in-out',
            }}
          />
        </div>

        {/* DOWN portion: dark charcoal */}
        <div
          style={{
            width: `${normalizedDown}%`,
            height: '100%',
            background: 'rgba(255, 255, 255, 0.22)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
