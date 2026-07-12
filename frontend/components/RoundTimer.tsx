'use client';

import React from 'react';
import { useMarket } from '@/lib/marketStore';

interface RoundTimerProps {
  startTimestamp: number;
  endTimestamp: number;
  lockTimestamp: number;
  resolved: boolean;
  targetMode?: 'lock' | 'end';
}

export function RoundTimer({ startTimestamp, endTimestamp, lockTimestamp, resolved, targetMode = 'end' }: RoundTimerProps) {
  const { now } = useMarket();

  const isLockMode = targetMode === 'lock';
  const targetTime = isLockMode ? lockTimestamp : endTimestamp;
  const totalStart = isLockMode ? startTimestamp : lockTimestamp;

  const timeLeft = Math.max(0, targetTime - now);
  const totalDuration = targetTime - totalStart;
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ── Lock mode: betting open ──────────────────────────────────────────────
  if (isLockMode) {
    // When timeLeft === 0, the MARKET LOCKED panel in ActiveRoundCard
    // already communicates the locked state — return null to avoid duplication.
    if (timeLeft === 0) return null;

    // Betting open — show monochrome countdown ring
    const size = 60;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {`${minutes}:${seconds.toString().padStart(2, '0')}`}
            </span>
          </div>
        </div>

        {/* Label */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
            BETTING OPEN
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Place your prediction now</div>
        </div>
      </div>
    );
  }

  // ── End mode: price movement / resolved ────────────────────────────────────
  const strokeColor = resolved ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)';
  const label = resolved ? 'RESOLVED' : timeLeft === 0 ? 'SETTLING' : 'PRICE MOVEMENT';
  const desc  = resolved ? 'Winnings claimable' : timeLeft === 0 ? 'Waiting for settlement…' : 'Waiting for close price';

  const size = 60;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {resolved ? '✓' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </div>
  );
}
