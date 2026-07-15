import React, { memo } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge = memo(function Badge({ children, variant = 'default', style, ...props }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'default':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-1)',
          border: '1px solid var(--border-2)',
        };
      case 'success':
        return {
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--text-1)',
          border: '1px solid var(--border-3)',
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.08)',
        };
      case 'warning':
        return {
          background: 'rgba(255, 255, 255, 0.03)',
          color: 'var(--text-2)',
          border: '1px solid var(--border-2)',
        };
      case 'error':
        return {
          background: 'rgba(255, 255, 255, 0.02)',
          color: 'var(--text-2)',
          border: '1px solid var(--border-2)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-2)',
          border: '1px solid var(--border-2)',
        };
      default:
        return {};
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '10px',
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        ...getStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
