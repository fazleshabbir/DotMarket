'use client';

import React, { useState, useEffect } from 'react';

interface RoundTimerProps {
  startTimestamp: number;
  endTimestamp: number;
  lockTimestamp: number;
  resolved: boolean;
  targetMode?: 'lock' | 'end';
}

export function RoundTimer({ startTimestamp, endTimestamp, lockTimestamp, resolved, targetMode = 'end' }: RoundTimerProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLockMode = targetMode === 'lock';
  const targetTime = isLockMode ? lockTimestamp : endTimestamp;
  const totalStart = isLockMode ? startTimestamp : lockTimestamp;
  
  const timeLeft = Math.max(0, targetTime - now);
  const totalDuration = targetTime - totalStart;
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Determine color and labels based on state and target mode
  let color = 'var(--up)';
  let label = 'BETTING OPEN';
  let desc = 'Place your bets';

  if (isLockMode) {
    if (timeLeft === 0) {
      color = '#ffc107';
      label = 'BETTING CLOSED';
      desc = 'Awaiting next round';
    } else {
      color = 'var(--up)';
      label = 'BETTING OPEN';
      desc = 'Place bets now';
    }
  } else {
    if (resolved) {
      color = 'var(--text-muted)';
      label = 'RESOLVED';
      desc = 'Winnings claimable';
    } else if (timeLeft === 0) {
      color = 'var(--accent)';
      label = 'SETTLING';
      desc = 'Waiting for keeper...';
    } else {
      color = '#ff9800';
      label = 'PRICE MOVEMENT';
      desc = 'Waiting for close price';
    }
  }

  // Circle SVG parameters
  const size = 64;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Circular Progress */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}
          >
            {resolved ? '✓' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {desc}
        </div>
      </div>
    </div>
  );
}
