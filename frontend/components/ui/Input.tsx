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
        <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid',
          borderColor: focused
            ? 'var(--border-4)'
            : error
              ? 'var(--text-2)'
              : 'var(--border-2)',
          borderRadius: 'var(--radius-md)',
          boxShadow: focused
            ? '0 0 12px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.015)',
          transition: 'all var(--duration-fast) var(--ease-out)',
          padding: '0 14px',
        }}
      >
        {prefixSymbol && (
          <span style={{ color: 'var(--text-3)', fontSize: '13px', marginRight: '8px', fontFamily: 'var(--font-mono)' }}>
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
            color: 'var(--text-1)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            padding: '10px 0',
            width: '100%',
            ...style
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
