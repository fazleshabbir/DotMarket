'use client';

import React, { memo } from 'react';
import { LockIcon } from '../ui/LockIcon';
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconZap = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconClock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconX = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconLoader = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

// ── Unified Status Type ────────────────────────────────────────────────────────
export type StatusType =
  | 'live'
  | 'active'
  | 'ready'
  | 'locked'
  | 'settling'
  | 'settled'
  | 'canceled'
  | 'upcoming'
  | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showPulse?: boolean;
}

const STATUS_CONFIG: Record<StatusType, {
  label: string;
  icon: React.ReactNode;
  textOpacity: string;
  pulse?: boolean;
}> = {
  live: {
    label: 'LIVE',
    icon: null, // uses pulse dot
    textOpacity: '#ffffff',
    pulse: true,
  },
  active: {
    label: 'ACTIVE',
    icon: <IconZap />,
    textOpacity: '#ffffff',
    pulse: true,
  },
  ready: {
    label: 'READY',
    icon: <IconZap />,
    textOpacity: '#ffffff',
  },
  locked: {
    label: 'LOCKED',
    icon: <LockIcon size={10} style={{ opacity: 0.9 }} />,
    textOpacity: 'rgba(255,255,255,0.7)',
  },
  settling: {
    label: 'SETTLING',
    icon: <IconLoader />,
    textOpacity: 'rgba(255,255,255,0.6)',
  },
  settled: {
    label: 'SETTLED',
    icon: <IconCheck />,
    textOpacity: 'rgba(255,255,255,0.55)',
  },
  canceled: {
    label: 'CANCELED',
    icon: <IconX />,
    textOpacity: 'rgba(255,255,255,0.35)',
  },
  upcoming: {
    label: 'UPCOMING',
    icon: <IconClock />,
    textOpacity: 'rgba(255,255,255,0.45)',
  },
  pending: {
    label: 'PENDING',
    icon: <IconLoader />,
    textOpacity: 'rgba(255,255,255,0.5)',
  },
};

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
  showPulse,
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ready;
  const displayLabel = label || cfg.label;
  const hasPulse = showPulse ?? cfg.pulse;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 26,
        padding: '0 12px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: cfg.textOpacity,
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'border-color 300ms ease, opacity 300ms ease',
        flexShrink: 0,
      }}
    >
      {hasPulse ? (
        <span
          className="animate-pulse-live"
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}
        />
      ) : cfg.icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {cfg.icon}
        </span>
      ) : null}
      {displayLabel}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
