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

  // ── Lock mode: betting open / closed ──────────────────────────────────────
  if (isLockMode) {
    if (timeLeft === 0) {
      // Betting closed — show a clean pill badge, no broken 0:00 timer
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: 18 }}>🔒</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
              BETTING CLOSED
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting next round</div>
          </div>
        </div>
      );
    }

    // Betting open — show countdown timer
    const color = 'var(--up)';
    const label = 'BETTING OPEN';
    const desc = 'Place bets now';
    const size = 64;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={color} strokeWidth={strokeWidth}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>
              {`${minutes}:${seconds.toString().padStart(2, '0')}`}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
        </div>
      </div>
    );
  }

  // ── End mode: price movement / resolved ───────────────────────────────────
  let color = '#ff9800';
  let label = 'PRICE MOVEMENT';
  let desc = 'Waiting for close price';

  if (resolved) {
    color = 'var(--text-muted)';
    label = 'RESOLVED';
    desc = 'Winnings claimable';
  } else if (timeLeft === 0) {
    color = 'var(--accent)';
    label = 'SETTLING';
    desc = 'Waiting for keeper...';
  }

  const size = 64;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>
            {resolved ? '✓' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </div>
  );
}
