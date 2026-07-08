'use client';

import React, { useState, useEffect } from 'react';

interface RoundTimerProps {
  startTimestamp: number;
  endTimestamp: number;
  lockTimestamp: number;
  resolved: boolean;
}

export function RoundTimer({ startTimestamp, endTimestamp, lockTimestamp, resolved }: RoundTimerProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = Math.max(0, endTimestamp - now);
  const totalDuration = endTimestamp - startTimestamp;
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
  const isLocked = now >= lockTimestamp;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Determine color based on state
  let color = 'var(--up)';
  let label = 'OPEN';
  if (resolved) {
    color = 'var(--text-muted)';
    label = 'RESOLVED';
  } else if (timeLeft === 0) {
    color = 'var(--accent)';
    label = 'RESOLVING';
  } else if (isLocked) {
    color = '#ffc107';
    label = 'LOCKED';
  }

  // Circle SVG parameters
  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Circular Progress */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        {/* Timer Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}
          >
            {resolved ? '✓' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {resolved
            ? 'Awaiting next round'
            : timeLeft === 0
            ? 'Waiting for keeper...'
            : isLocked
            ? 'Bets are locked'
            : 'Place your bets'}
        </div>
      </div>
    </div>
  );
}
