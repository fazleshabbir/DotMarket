'use client';

import React, { memo } from 'react';
import { ConnectButton } from '../ConnectButton';
import { Logo } from '../ui/Logo';

interface TradeHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = ['Live Market', 'Portfolio', 'Leaderboard'] as const;

export const TradeHeader = memo(function TradeHeader({ activeTab, setActiveTab }: TradeHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 16,
        zIndex: 100,
        margin: '16px 20px 0',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-xl)',
        background: 'rgba(4, 4, 4, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}
    >
      {/* LEFT: Logo + Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>

        {/* Logo */}
        <Logo size="md" />

        {/* Vertical divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border-2)', flexShrink: 0 }} />

        {/* Tab Navigation — Hyperliquid-style underline tabs */}
        <nav style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontSize: 13,
                  color: isActive ? '#f0f0f0' : 'var(--text-3)',
                  fontWeight: isActive ? 500 : 400,
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive
                    ? '1.5px solid rgba(255,255,255,0.8)'
                    : '1.5px solid transparent',
                  cursor: 'pointer',
                  padding: '4px 14px',
                  margin: '0 2px',
                  height: 52,
                  position: 'relative',
                  transition: 'color var(--duration-fast) var(--ease-out)',
                  letterSpacing: '0',
                  fontFamily: 'var(--font-sans)',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* RIGHT: Chain badge + Wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

        {/* ARC Testnet chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-2)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <div
            className="animate-pulse-live"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ffffff',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-2)',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            ARC Testnet
          </span>
        </div>

        <ConnectButton />
      </div>
    </header>
  );
});

TradeHeader.displayName = 'TradeHeader';
