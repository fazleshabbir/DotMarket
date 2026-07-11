'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { BettingPanel } from '@/components/BettingPanel';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TradeHeader } from '@/components/trade/TradeHeader';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { PriceTicker } from '@/components/trade/PriceTicker';
import { PositionsTable } from '@/components/PositionsTable';

function CountdownText({ lockTimestamp }: { lockTimestamp: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = Math.max(0, lockTimestamp - now);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
      {timeLeft > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : 'CLOSED'}
    </strong>
  );
}

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
        overflowX: 'clip',
        width: '100%',
        maxWidth: '100%',
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
            <Button
              variant="primary"
              size="lg"
              style={{
                width: '100%',
                letterSpacing: '1px',
              }}
            >
              Back to Home
            </Button>
          </Link>

          <Button
            onClick={handleCopy}
            variant="secondary"
            size="md"
            style={{
              width: '100%',
              borderRadius: '12px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function TradePage() {
  const { isConnected } = useAccount();
  const [btcPrice, setBtcPrice] = useState(62000.0);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200); // Default to desktop
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

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

  const activeTotalPool = round ? round.totalUpAmount + round.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((round!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

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
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      {/* Top sticky blurred navigation header */}
      <TradeHeader />

      {/* ── Sub-Header Live Market strip ───────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.01)',
          fontSize: 12,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          margin: '16px 24px 0 24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: '#ffffff', letterSpacing: '0.08em' }}>★ BTC-USD</strong>
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Live Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>TIME LEFT:</span>{' '}
          <CountdownText lockTimestamp={round ? Number(round.lockTimestamp) : 0} />
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Current Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>CURRENT PRICE:</span>{' '}
          <PriceTicker price={btcPrice} />
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Pool */}
        <div>
          <span style={{ color: 'var(--text-muted)' }}>ROUND POOL:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {round ? `${(Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(2)} ETH` : '0.00 ETH'}
          </strong>
        </div>

        <div style={{ flexGrow: 1 }} />
      </div>

      {/* ── Main Layout Workspace ───────────────────────────────── */}
      <ScrollFade style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 16,
            padding: '12px 16px 24px 16px',
            background: '#000000',
            width: '100%',
            maxWidth: 1600,
            margin: '0 auto',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          {/* Main workspace Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '76fr 24fr',
              gap: 16,
              width: '100%',
              height: '100%',
              minHeight: 0,
            }}
          >
            {/* Left Column: Chart Container + Activity (76% width, Fixed) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TradingPanel btcPrice={btcPrice} round={round} activeUpPercent={activeUpPercent} activeDownPercent={activeDownPercent} />
              </div>
              <div style={{ flexShrink: 0, minHeight: 0 }}>
                <PositionsTable btcPrice={btcPrice} />
              </div>
            </div>

            {/* Right Column: Unified Betting Sidebar (24% width, Static) */}
            <div
              style={{
                height: '100%',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <BettingPanel currentBtcPrice={btcPrice} />
            </div>
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
