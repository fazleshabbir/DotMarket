'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { BettingPanel } from '@/components/BettingPanel';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { TradeHeader } from '@/components/trade/TradeHeader';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { PriceTicker } from '@/components/trade/PriceTicker';
import { PositionsTable } from '@/components/PositionsTable';
import { MarketProvider, useMarket } from '@/lib/marketStore';

function CountdownText() {
  const { timeLeftToLock, timeLeftToEnd, marketStatus } = useMarket();

  const timeLeft = marketStatus === 'OPEN' ? timeLeftToLock : timeLeftToEnd;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (marketStatus === 'SETTLING') {
    return <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>SETTLING</strong>;
  }
  if (marketStatus === 'NEXT ROUND') {
    return <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>0:00</strong>;
  }
  if (marketStatus === 'AWAITING PLAYERS') {
    return <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>—:—</strong>;
  }

  return (
    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
      {timeLeft > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : 'CLOSED'}
    </strong>
  );
}

function DesktopTradingOnly() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflowX: 'clip',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="animate-float-laptop" style={{ marginBottom: '32px' }}>
          <svg viewBox="0 0 200 120" width="180" height="108" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>
            </defs>
            <rect x="30" y="20" width="140" height="80" rx="6" fill="url(#laptopScreenGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            <rect x="35" y="25" width="130" height="70" rx="3" fill="#050505" />
            <line x1="35" y1="48" x2="165" y2="48" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="35" y1="72" x2="165" y2="72" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="78" y1="25" x2="78" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="122" y1="25" x2="122" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <path d="M 40 75 Q 65 40 90 60 T 130 35 T 160 55" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="160" cy="55" r="2.5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }} />
            <path d="M 12 100 L 188 100 L 176 110 L 24 110 Z" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            <rect x="85" y="101" width="30" height="6" rx="1.5" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
          </svg>
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 400, color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
          Desktop Trading Only
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 36px', fontWeight: 400 }}>
          DotMarket's trading terminal is currently optimized for desktop devices. Mobile trading is coming soon.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="primary" size="lg" style={{ width: '100%', letterSpacing: '1px' }}>
              Back to Home
            </Button>
          </Link>
          <Button onClick={handleCopy} variant="secondary" size="md" style={{ width: '100%', borderRadius: '12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Link Copied!' : 'Open on Desktop'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TerminalClient() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { btcPrice, activeRound: round, activeTotalPool, balanceSymbol, marketStatus } = useMarket();

  if (windowWidth < 1024) {
    return <DesktopTradingOnly />;
  }

  const poolSize = round ? (Number(activeTotalPool) / 1e18).toFixed(4) : '0.0000';

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      <TradeHeader />

      <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '12px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.01)', fontSize: 12, overflowX: 'auto', whiteSpace: 'nowrap', margin: '16px 24px 0 24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: '#ffffff', letterSpacing: '0.08em' }}>★ BTC-USD</strong>
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontWeight: 700, letterSpacing: '0.08em' }}>{marketStatus}</span>
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>TIME LEFT:</span> <CountdownText />
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>CURRENT PRICE:</span> <PriceTicker price={btcPrice} />
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <span style={{ color: 'var(--text-muted)' }}>ROUND POOL:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{poolSize} {balanceSymbol}</strong>
        </div>
        <div style={{ flexGrow: 1 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', padding: '16px 24px 24px 24px', gap: 16, minHeight: 0, boxSizing: 'border-box' }}>
        {/* Left Section: Chart (Top) + Positions (Bottom) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: '6 1 0', minHeight: 0 }}>
            <TradingPanel />
          </div>
          <div style={{ flex: '4 1 0', minHeight: 0 }}>
            <PositionsTable />
          </div>
        </div>

        {/* Right Section: Betting Panel */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <BettingPanel currentBtcPrice={btcPrice} />
        </div>
      </div>
    </div>
  );
}

// Disable SSR for the entire trading terminal to prevent hydration mismatch from Date.now()
const DynamicTerminalClient = dynamic(() => Promise.resolve(TerminalClient), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', width: '100vw', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>LOADING TERMINAL...</div>
    </div>
  )
});

export default function TradePage() {
  return <DynamicTerminalClient />;
}
