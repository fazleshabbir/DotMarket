'use client';

import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'up' | 'down';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: hovered
            ? 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
          color: '#000000',
          border: 'none',
          boxShadow: hovered ? '0 0 25px rgba(255, 255, 255, 0.25)' : 'none',
        };
      case 'secondary':
        return {
          background: hovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderColor: hovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: hovered ? '0 10px 20px -10px rgba(0,0,0,0.5)' : 'none',
        };
      case 'outline':
        return {
          background: hovered ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          color: '#ffffff',
          border: '1px solid',
          borderColor: hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
        };
      case 'up':
        return {
          background: hovered
            ? 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
          color: '#000000',
          border: 'none',
          boxShadow: hovered ? '0 0 30px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(255, 255, 255, 0.1)',
        };
      case 'down':
        return {
          background: hovered ? 'rgba(82, 82, 82, 0.25)' : 'rgba(82, 82, 82, 0.15)',
          color: '#ffffff',
          border: '1px solid rgba(82, 82, 82, 0.3)',
          borderColor: hovered ? 'rgba(82, 82, 82, 0.5)' : 'rgba(82, 82, 82, 0.3)',
          boxShadow: hovered ? '0 0 20px rgba(82, 82, 82, 0.2)' : 'none',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 14px', fontSize: '12px' };
      case 'md':
        return { padding: '10px 22px', fontSize: '13px' };
      case 'lg':
        return { padding: '14px 32px', fontSize: '14px' };
      default:
        return {};
    }
  };

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        outline: 'none',
        transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
