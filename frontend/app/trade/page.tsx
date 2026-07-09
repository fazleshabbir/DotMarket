'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { ROUND_MARKET_ABI, MARKET_ADDRESS } from '@/lib/abi';
import { ConnectButton } from '@/components/ConnectButton';
import { TradingViewChart } from '@/components/TradingViewChart';
import { BettingPanel } from '@/components/BettingPanel';
import { PositionsTable } from '@/components/PositionsTable';
import { ScrollFade } from '@/components/ScrollFade';

interface RoundData {
  roundId: bigint;
  startPrice: bigint;
  closePrice: bigint;
  totalUpAmount: bigint;
  totalDownAmount: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  endTimestamp: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  resolved: boolean;
  canceled: boolean;
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
        overflow: 'hidden',
      }}
    >
      {/* Background glow matching landing page design */}
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
        {/* Floating laptop illustration mark */}
        <div className="animate-float-laptop" style={{ marginBottom: '32px' }}>
          <svg viewBox="0 0 200 120" width="180" height="108" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>
            </defs>
            {/* Screen border (glass panel bezel) */}
            <rect x="30" y="20" width="140" height="80" rx="6" fill="url(#laptopScreenGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            {/* Screen inner displays chart */}
            <rect x="35" y="25" width="130" height="70" rx="3" fill="#050505" />
            {/* Grid line details */}
            <line x1="35" y1="48" x2="165" y2="48" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="35" y1="72" x2="165" y2="72" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="78" y1="25" x2="78" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="122" y1="25" x2="122" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            {/* Chart line */}
            <path d="M 40 75 Q 65 40 90 60 T 130 35 T 160 55" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            {/* Pulsing indicator dot */}
            <circle cx="160" cy="55" r="2.5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }} />
            {/* Keyboard base plate */}
            <path d="M 12 100 L 188 100 L 176 110 L 24 110 Z" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            {/* Trackpad */}
            <rect x="85" y="101" width="30" height="6" rx="1.5" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '32px',
            fontWeight: 400,
            color: '#ffffff',
            margin: '0 0 16px',
            letterSpacing: '-0.5px',
          }}
        >
          Desktop Trading Only
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 36px',
            fontWeight: 400,
          }}
        >
          DotMarket's trading terminal is currently optimized for desktop devices. Mobile trading is coming soon.
        </p>

        {/* Action Button stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', width: '100%' }}>
            <button
              className="btn-up"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '8px',
                letterSpacing: '1px',
                textAlign: 'center',
              }}
            >
              Back to Home
            </button>
          </Link>

          <button
            onClick={handleCopy}
            className="glass-card"
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Link Copied!' : 'Open on Desktop'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  const { isConnected } = useAccount();
  const [btcPrice, setBtcPrice] = useState(62000.0);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200); // Default to desktop

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Read current round ID to show in sub-header
  const { data: currentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 5000 },
  });

  const roundId = currentRoundId ? BigInt(currentRoundId.toString()) : 0n;

  // Read current round data
  const { data: roundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [roundId],
    query: { enabled: roundId > 0n, refetchInterval: 5000 },
  });

  const round = roundData as unknown as RoundData | undefined;

  // Fetch live price from Binance API to match chart exactly
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const data = await res.json();
        if (data && data.price) {
          setBtcPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error('Error fetching Binance price:', err);
      }
    };

    fetchBtcPrice(); // Initial fetch
    const interval = setInterval(fetchBtcPrice, 1000); // Fetch every 1 second
    return () => clearInterval(interval);
  }, []);

  const isDesktop = !isMounted || windowWidth >= 1024;

  if (!isDesktop) {
    return <DesktopTradingOnly />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: '#000000',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="4.5" fill="#ffffff" />
            </svg>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', fontFamily: 'Inter, sans-serif' }}>
              dot<span style={{ fontWeight: 300, color: '#a3a3a3' }}>Market</span>
            </span>
          </Link>

          {/* Navigation Links capsule */}
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
            {['Trade', 'Leaderboard', 'Portfolio'].map((tab) => (
              <a
                key={tab}
                href="#"
                style={{
                  fontSize: 13,
                  color: tab === 'Trade' ? '#ffffff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: tab === 'Trade' ? 600 : 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = tab === 'Trade' ? '#ffffff' : 'var(--text-secondary)')}
              >
                {tab}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Wallet Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--up)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ARC TESTNET</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* ── Sub-Header Ticker Details ──────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          padding: '8px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.01)',
          fontSize: 12,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: '#ffffff' }}>★ BTC-USD Round Forecast</strong>
        </div>
        
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        <div>
          <span style={{ color: 'var(--text-muted)' }}>CURRENT PRICE:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${btcPrice.toFixed(2)}</strong>
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        <div>
          <span style={{ color: 'var(--text-muted)' }}>ROUND POOL:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {round ? `${(Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(2)} USDC` : '0.00 USDC'}
          </strong>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <ScrollFade style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            padding: 16,
            background: '#000000',
            width: '100%',
          }}
        >
          {/* Left Panel: Chart & Positions Table (70% width) */}
          <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', minWidth: 500 }}>
            {/* Interactive TradingView Chart */}
            <TradingViewChart />

            {/* Professional Positions & Claims Table */}
            <PositionsTable />
          </div>

          {/* Right Panel: Betting Controller & Round Stats (30% width) */}
          <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <BettingPanel currentBtcPrice={btcPrice} />
          </div>
        </main>
      </ScrollFade>
    </div>
  );
}
