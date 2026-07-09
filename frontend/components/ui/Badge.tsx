import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ children, variant = 'default', style, ...props }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'default':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        };
      case 'success':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        };
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.05)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        };
      case 'error':
        return {
          background: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...getStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </span>
  );
}
