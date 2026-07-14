'use client';

import React from 'react';
import { useMarket } from '@/lib/marketStore';

export function GlobalRoundTimer({ target = 'active' }: { target?: 'active' | 'prev' }) {
  const {
    marketStatus,
    timeLeftToLock,
    timeLeftToEnd,
    activeRound,
    prevMarketStatus,
    prevTimeLeftToLock,
    prevTimeLeftToEnd,
    prevRound,
    phase,
  } = useMarket();

  // Pick variables depending on the target round, with fallback when active round closes/locks
  const isCurrentRoundClosed = marketStatus === 'LOCKED' || marketStatus === 'SETTLING';
  const effectiveTarget = (target === 'prev' && isCurrentRoundClosed) ? 'active' : target;

  const status = effectiveTarget === 'active' ? marketStatus : prevMarketStatus;
  const round = effectiveTarget === 'active' ? activeRound : prevRound;
  const lockTimeLeft = effectiveTarget === 'active' ? timeLeftToLock : prevTimeLeftToLock;
  const endTimeLeft = effectiveTarget === 'active' ? timeLeftToEnd : prevTimeLeftToEnd;

  // Determine target timing variables based on state
  let timeLeft = 0;
  let totalDuration = 60;
  let strokeColor = 'rgba(255,255,255,0.7)';
  let labelText = 'BETTING OPEN';
  let descText = 'Place your prediction now';

  if (status === 'OPEN') {
    timeLeft = lockTimeLeft;
    const start = round ? Number(round.startTimestamp) : 0;
    const lock = round ? Number(round.lockTimestamp) : 0;
    totalDuration = lock > start ? (lock - start) : 60;
    strokeColor = 'rgba(255,255,255,0.7)';
    labelText = 'BETTING OPEN';
    descText = 'Place your prediction now';
  } else if (status === 'LOCKED') {
    timeLeft = endTimeLeft;
    const lock = round ? Number(round.lockTimestamp) : 0;
    const end = round ? Number(round.endTimestamp) : 0;
    totalDuration = end > lock ? (end - lock) : 60;
    strokeColor = 'rgba(255,255,255,0.6)';
    labelText = 'LOCKED';
    descText = 'Waiting for close price';
  } else if (status === 'SETTLING') {
    timeLeft = 0;
    totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.25)';
    labelText = 'SETTLING';
    descText = 'Waiting for settlement…';
  } else if (status === 'NEXT ROUND') {
    timeLeft = 60;
    totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.2)';
    labelText = 'NEXT ROUND';
    descText = 'Starting soon…';
  } else {
    // AWAITING PLAYERS — but if phase is 'betting' or 'live', show something useful
    timeLeft = 0;
    totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.2)';
    labelText = phase === 'live' ? 'PROCESSING' : 'AWAITING PLAYERS';
    descText = phase === 'live' ? 'Round in progress…' : 'Waiting for genesis round';
  }

  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Ring rendering specifications
  const size = 60;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* Timer Ring SVG — remains permanently mounted */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        {/* Inner timer value */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {status === 'SETTLING' ? (
              <span className="animate-pulse-live">0:00</span>
            ) : status === 'NEXT ROUND' ? (
              '0:00'
            ) : status === 'AWAITING PLAYERS' ? (
              '—:—'
            ) : (
              `${minutes}:${seconds.toString().padStart(2, '0')}`
            )}
          </span>
        </div>
      </div>

      {/* Ticking Label details */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
          {labelText}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{descText}</div>
      </div>
    </div>
  );
}
