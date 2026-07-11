'use client';

import React, { memo } from 'react';

interface StatusBadgeProps {
  status: 'active' | 'locked' | 'resolved' | 'canceled';
  label?: string;
}

export const StatusBadge = memo(function StatusBadge({ status, label }: StatusBadgeProps) {
  const getColors = () => {
    switch (status) {
      case 'active':
        return {
          bg: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          text: '#ffffff',
          dot: '#ffffff',
        };
      case 'locked':
        return {
          bg: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          text: 'rgba(255, 255, 255, 0.5)',
          dot: 'rgba(255, 255, 255, 0.3)',
        };
      case 'resolved':
        return {
          bg: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          text: '#ffffff',
          dot: null,
        };
      case 'canceled':
        return {
          bg: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          text: 'rgba(255, 255, 255, 0.4)',
          dot: null,
        };
    }
  };

  const colors = getColors();
  const displayLabel = label || status.toUpperCase();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.5px',
        background: colors.bg,
        border: colors.border,
        color: colors.text,
        textTransform: 'uppercase',
      }}
    >
      {colors.dot && (
        <span
          className={status === 'active' ? 'animate-pulse-live' : ''}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: colors.dot,
            boxShadow: status === 'active' ? '0 0 6px #ffffff' : 'none',
          }}
        />
      )}
      {displayLabel}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
