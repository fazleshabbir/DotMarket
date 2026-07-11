import React, { useState, memo } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixSymbol?: string;
}

export const Input = memo(function Input({ label, error, prefixSymbol, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(15, 15, 15, 0.4)',
          border: '1px solid',
          borderColor: focused
            ? 'rgba(255, 255, 255, 0.25)'
            : error
              ? 'rgba(239, 68, 68, 0.4)'
              : 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          boxShadow: focused 
            ? '0 0 15px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
            : 'inset 0 1px 0 rgba(255,255,255,0.02)',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '0 16px',
        }}
      >
        {prefixSymbol && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginRight: '8px', fontFamily: 'var(--font-mono)' }}>
            {prefixSymbol}
          </span>
        )}
        <input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            padding: '12px 0',
            width: '100%',
            ...style
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: '#ef4444' }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
