'use client';

import React from 'react';
import { useMarket } from '@/lib/marketStore';

export function GlobalRoundTimer({ target = 'active' }: { target?: 'active' | 'prev' | 'live' }) {
  const {
    marketStatus, timeLeftToLock, timeLeftToEnd,
    activeRound, prevMarketStatus, prevTimeLeftToLock, prevTimeLeftToEnd,
    prevRound, phase,
  } = useMarket();

  // ── 'live' target ─────────────────────────────────────────────────────────
  if (target === 'live') {
    const timeLeft = timeLeftToEnd;
    const lock = activeRound ? Number(activeRound.lockTimestamp) : 0;
    const end  = activeRound ? Number(activeRound.endTimestamp) : 0;
    const totalDuration = end > lock ? (end - lock) : 60;
    const progress = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
    const isUrgent = timeLeft > 0 && timeLeft <= 10;

    return (
      <RingDisplay
        timeLeft={timeLeft}
        progress={progress}
        label="LOCKED"
        desc={timeLeft > 0 ? 'Awaiting settlement' : 'Settling now…'}
        isUrgent={isUrgent}
        strokeColor={isUrgent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}
      />
    );
  }

  // ── 'active' / 'prev' targets ─────────────────────────────────────────────
  const isCurrentRoundClosed = marketStatus === 'LOCKED' || marketStatus === 'SETTLING';
  const effectiveTarget = (target === 'prev' && isCurrentRoundClosed) ? 'active' : target;

  const status       = effectiveTarget === 'active' ? marketStatus : prevMarketStatus;
  const round        = effectiveTarget === 'active' ? activeRound  : prevRound;
  const lockTimeLeft = effectiveTarget === 'active' ? timeLeftToLock : prevTimeLeftToLock;
  const endTimeLeft  = effectiveTarget === 'active' ? timeLeftToEnd  : prevTimeLeftToEnd;

  let timeLeft = 0;
  let totalDuration = 60;
  let strokeColor   = 'rgba(255,255,255,0.7)';
  let labelText     = 'BETTING OPEN';
  let descText      = 'Place your prediction now';

  if (status === 'OPEN') {
    timeLeft = lockTimeLeft;
    const start = round ? Number(round.startTimestamp) : 0;
    const lock  = round ? Number(round.lockTimestamp)  : 0;
    totalDuration = lock > start ? (lock - start) : 60;
    strokeColor = 'rgba(255,255,255,0.7)';
    labelText = 'BETTING OPEN';
    descText  = 'Place your prediction now';
  } else if (status === 'LOCKED') {
    timeLeft = endTimeLeft;
    const lock = round ? Number(round.lockTimestamp) : 0;
    const end  = round ? Number(round.endTimestamp)  : 0;
    totalDuration = end > lock ? (end - lock) : 60;
    strokeColor = 'rgba(255,255,255,0.6)';
    labelText = 'LOCKED';
    descText  = 'Waiting for close price';
  } else if (status === 'SETTLING') {
    timeLeft = 0; totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.25)';
    labelText = 'SETTLING'; descText = 'Waiting for settlement…';
  } else if (status === 'NEXT ROUND') {
    timeLeft = 60; totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.2)';
    labelText = 'NEXT ROUND'; descText = 'Starting soon…';
  } else {
    timeLeft = 0; totalDuration = 60;
    strokeColor = 'rgba(255,255,255,0.2)';
    labelText = phase === 'live' ? 'PROCESSING'       : 'AWAITING PLAYERS';
    descText  = phase === 'live' ? 'Round in progress…' : 'Waiting for genesis round';
  }

  const progress  = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
  const isUrgent  = status === 'OPEN' && timeLeft > 0 && timeLeft <= 10;
  if (isUrgent) strokeColor = 'rgba(255,255,255,1)';

  return (
    <RingDisplay
      timeLeft={timeLeft}
      progress={progress}
      label={labelText}
      desc={descText}
      isUrgent={isUrgent}
      strokeColor={strokeColor}
      status={status}
    />
  );
}

// ── Shared ring renderer ──────────────────────────────────────────────────────
function RingDisplay({
  timeLeft, progress, label, desc, isUrgent, strokeColor, status,
}: {
  timeLeft: number; progress: number; label: string; desc: string;
  isUrgent: boolean; strokeColor: string; status?: string;
}) {
  const size        = 72;
  const strokeWidth = 3;
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference * (1 - progress);
  const minutes     = Math.floor(timeLeft / 60);
  const seconds     = timeLeft % 60;

  const innerText = () => {
    if (status === 'SETTLING') return <span className="animate-pulse-live">0:00</span>;
    if (status === 'NEXT ROUND') return '0:00';
    if (status === 'AWAITING PLAYERS') return '—:—';
    if (timeLeft <= 0) return <span className="animate-pulse-live">0:00</span>;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Ring */}
      <div style={{
        position: 'relative',
        width: size, height: size,
        flexShrink: 0,
        filter: isUrgent ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : undefined,
        animation: isUrgent ? 'urgentPulse 0.8s ease-in-out infinite' : undefined,
      }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
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
        {/* Inner time */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: isUrgent ? 11 : 12,
            fontWeight: 700,
            color: isUrgent ? '#ffffff' : '#ffffff',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}>
            {innerText()}
          </span>
        </div>
      </div>

      {/* Label */}
      <div>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: isUrgent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4,
          transition: 'color 300ms ease',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
      </div>

      <style>{`
        @keyframes urgentPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255,255,255,0.5)); }
          50%       { filter: drop-shadow(0 0 14px rgba(255,255,255,0.9)); }
        }
      `}</style>
    </div>
  );
}
