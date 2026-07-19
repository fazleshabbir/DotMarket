'use client';

import React, { memo, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { ConnectButton } from '../ConnectButton';
import { Logo } from '../ui/Logo';

interface TradeHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = ['Live Market', 'Portfolio', 'Leaderboard'] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChart = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,12 5,7 9,9 15,3" />
    <line x1="1" y1="15" x2="15" y2="15" />
  </svg>
);

const IconPortfolio = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="14" height="11" rx="2" />
    <path d="M5 4V3a3 3 0 0 1 6 0v1" />
    <line x1="8" y1="8" x2="8" y2="11" />
    <line x1="6" y1="10" x2="10" y2="10" />
  </svg>
);

const IconLeaderboard = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1"  y="8"  width="4" height="7" rx="1" />
    <rect x="6"  y="4"  width="4" height="11" rx="1" />
    <rect x="11" y="1"  width="4" height="14" rx="1" />
  </svg>
);

const TAB_ICONS = {
  'Live Market':  <IconChart />,
  'Portfolio':    <IconPortfolio />,
  'Leaderboard':  <IconLeaderboard />,
};

// ─── TradeHeader ─────────────────────────────────────────────────────────────

export const TradeHeader = memo(function TradeHeader({ activeTab, setActiveTab }: TradeHeaderProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);

  // Use useLayoutEffect so the pill is positioned synchronously before first paint
  useLayoutEffect(() => {
    const btn = tabRefs.current[activeTab];
    const nav = navRef.current;
    if (!btn || !nav) return;

    const navRect = btn.parentElement?.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (!navRect) return;

    setPillStyle({
      left:    btnRect.left - navRect.left,
      width:   btnRect.width,
      opacity: 1,
    });
  }, [activeTab]);

  const handleTabClick = useCallback((tab: string) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  return (
    <>
      <style>{`
        .trade-tab-btn {
          font-size: 12.5px;
          font-weight: 400;
          color: var(--text-3);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 14px;
          height: 36px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 8px;
          position: relative;
          z-index: 1;
          transition: color 180ms cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--font-sans);
          letter-spacing: 0;
          white-space: nowrap;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }
        .trade-tab-btn:hover:not(.trade-tab-btn--active) {
          color: var(--text-2);
        }
        .trade-tab-btn--active {
          color: var(--text-1);
          font-weight: 500;
        }
        .trade-tab-pill {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: none;
          /* GPU-composited animation — no layout, no paint */
          transition:
            left   220ms cubic-bezier(0.4, 0, 0.2, 1),
            width  220ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 120ms ease;
          will-change: left, width;
        }
        .trade-chain-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-2);
          padding: 5px 10px;
          border-radius: var(--radius-full);
          transition: border-color 180ms ease;
        }
        .trade-chain-badge:hover { border-color: rgba(255,255,255,0.15); }
      `}</style>

      <header
        style={{
          position:   'sticky',
          top:        16,
          zIndex:     100,
          margin:     '16px 20px 0',
          padding:    '0 16px',
          height:     52,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 'var(--radius-xl)',
          background:   'rgba(4,4,4,0.76)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:    '1px solid var(--border-2)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}
      >
        {/* LEFT: Logo + Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

          {/* Logo */}
          <Logo size="md" />

          {/* Vertical divider */}
          <div style={{ width: 1, height: 18, background: 'var(--border-2)', flexShrink: 0 }} />

          {/* Tab Navigation — smooth sliding pill */}
          <nav
            ref={navRef}
            style={{
              display:  'flex',
              gap:      0,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Animated background pill — moves with CSS transition */}
            <div
              className="trade-tab-pill"
              style={{
                left:    pillStyle.left,
                width:   pillStyle.width,
                opacity: pillStyle.opacity,
              }}
            />

            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  ref={(el) => { tabRefs.current[tab] = el; }}
                  onClick={() => handleTabClick(tab)}
                  className={`trade-tab-btn${isActive ? ' trade-tab-btn--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={tab}
                >
                  <span style={{ opacity: isActive ? 1 : 0.7, transition: 'opacity 180ms ease' }}>
                    {TAB_ICONS[tab as keyof typeof TAB_ICONS]}
                  </span>
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Chain badge + Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="trade-chain-badge">
            <div
              className="animate-pulse-live"
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffffff', flexShrink: 0 }}
            />
            <span style={{
              fontSize:   10,
              fontWeight: 600,
              color:      'var(--text-2)',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}>
              ARC Testnet
            </span>
          </div>

          <ConnectButton />
        </div>
      </header>
    </>
  );
});

TradeHeader.displayName = 'TradeHeader';
