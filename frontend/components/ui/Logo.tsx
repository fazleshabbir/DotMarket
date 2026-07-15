import React, { memo } from 'react';
import Link from 'next/link';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

export const Logo = memo(function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 90, height: 27, viewBox: '0 0 200 60', fontSizeDot: 26, fontSizeMarket: 26 };
      case 'lg':
        return { width: 140, height: 42, viewBox: '0 0 200 60', fontSizeDot: 26, fontSizeMarket: 26 };
      case 'md':
      default:
        return { width: 120, height: 36, viewBox: '0 0 200 60', fontSizeDot: 26, fontSizeMarket: 26 };
    }
  };

  const { width, height, viewBox } = getDimensions();

  const logoSvg = (
    <svg viewBox={viewBox} width={width} height={height} xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <mask id={`logoMask-${size}`}>
          <rect x="0" y="0" width="200" height="60" fill="white" />
          <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
        </mask>
      </defs>
      <circle cx="16" cy="30" r="10" fill="#ffffff" mask={`url(#logoMask-${size})`} />
      <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
      <text x="54" y="38" fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
      <text x="95" y="38" fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="26" fontWeight="300" fill="var(--text-3, #6b6b6b)" letterSpacing="-1">Market</text>
    </svg>
  );

  if (!href) {
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{logoSvg}</span>;
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {logoSvg}
    </Link>
  );
});

Logo.displayName = 'Logo';
