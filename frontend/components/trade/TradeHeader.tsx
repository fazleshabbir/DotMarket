'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '../ConnectButton';

interface TradeHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TradeHeader = memo(function TradeHeader({ activeTab, setActiveTab }: TradeHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 24,
        zIndex: 100,
        margin: '24px 24px 0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        background: 'rgba(5, 5, 5, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 200 60" width="140" height="42" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tradeHeaderLogoMask">
                <rect x="0" y="0" width="200" height="60" fill="white" />
                <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
              </mask>
            </defs>
            <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#tradeHeaderLogoMask)" />
            <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
            <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
            <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
          </svg>
        </Link>

        {/* Navigation capsule */}
        <nav
          style={{
            display: 'flex',
            gap: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 24,
            padding: '6px 20px',
            alignItems: 'center',
          }}
        >
          {['Live Market', 'Portfolio', 'Leaderboard'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <a
                key={tab}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab);
                }}
                style={{
                  fontSize: 13,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 550,
                  transition: 'color 250ms ease',
                  position: 'relative',
                  padding: '4px 0',
                }}
              >
                {tab}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      right: 0,
                      height: 1.5,
                      background: '#ffffff',
                      borderRadius: 1,
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Wallet Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Monochrome Testnet Badge Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: 20,
          }}
        >
          <div
            className="animate-pulse-live"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 6px #ffffff',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.8px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ARC TESTNET
          </span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
});

TradeHeader.displayName = 'TradeHeader';
