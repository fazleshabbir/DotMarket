'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, usePublicClient } from 'wagmi';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { BettingPanel } from '@/components/BettingPanel';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { TradeHeader } from '@/components/trade/TradeHeader';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { PriceTicker } from '@/components/trade/PriceTicker';
import { PositionsTable } from '@/components/PositionsTable';

interface Bet {
  betId: bigint;
  user: string;
  position: number; // 0 = UP, 1 = DOWN
  stake: bigint;
  entryTime: bigint;
  expiryTime: bigint;
  entryPrice: bigint;
  settlementPrice: bigint;
  lockedMultiplier: bigint;
  status: number; // 0 = Running, 1 = Won, 2 = Lost, 3 = Push
  payout: bigint;
  claimed: boolean;
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="primary" size="lg" style={{ width: '100%', letterSpacing: '1px' }}>
              Back to Home
            </Button>
          </Link>

          <Button onClick={handleCopy} variant="secondary" size="md" style={{ width: '100%', borderRadius: '12px' }}>
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
  const { address } = useAccount();
  const [btcPrice, setBtcPrice] = useState(62000.0);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  // States read from contract
  const [activeUpPool, setActiveUpPool] = useState<bigint>(0n);
  const [activeDownPool, setActiveDownPool] = useState<bigint>(0n);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;
  const publicClient = usePublicClient();

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 1000);
    return () => clearInterval(interval);
  }, []);

  // Polling data loop for general page headers
  useEffect(() => {
    if (!publicClient || !MARKET_ADDRESS) return;

    let isSubscribed = true;

    const fetchGlobalPools = async () => {
      try {
        const [upPool, downPool] = await Promise.all([
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'activeUpPool' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'activeDownPool' }),
        ]) as [bigint, bigint];

        if (!isSubscribed) return;

        setActiveUpPool(upPool);
        setActiveDownPool(downPool);

        // Fetch user's active bets for drawing lines on chart
        if (address) {
          const betIds = await publicClient.readContract({
            address: MARKET_ADDRESS,
            abi: ROUND_MARKET_ABI,
            // @ts-ignore
            functionName: 'getUserBets',
            args: [address],
          }) as bigint[];

          if (!isSubscribed) return;

          const recentIds = betIds.slice(-20).reverse();

          const betsList = await Promise.all(
            recentIds.map(async (id) => {
              const data = await publicClient.readContract({
                address: MARKET_ADDRESS,
                abi: ROUND_MARKET_ABI,
                functionName: 'getBet',
                args: [id],
              }) as any;
              return {
                betId: data.betId,
                user: data.user,
                position: data.position,
                stake: data.stake,
                entryTime: data.entryTime,
                expiryTime: data.expiryTime,
                entryPrice: data.entryPrice,
                settlementPrice: data.settlementPrice,
                lockedMultiplier: data.lockedMultiplier,
                status: data.status,
                payout: data.payout,
                claimed: data.claimed,
              } as Bet;
            })
          );

          if (!isSubscribed) return;

          const active = betsList.filter((b) => b.status === 0);
          setActiveBets(active);
        }
      } catch (err) {
        console.error('Error fetching global pools:', err);
      }
    };

    fetchGlobalPools();
    const interval = setInterval(fetchGlobalPools, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [publicClient, MARKET_ADDRESS, address]);

  const activeTotalPool = activeUpPool + activeDownPool;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeUpPool * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const isDesktop = !isMounted || windowWidth >= 1024;

  if (!isDesktop) {
    return <DesktopTradingOnly />;
  }

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      <TradeHeader />

      {/* ── Sub-Header Live Market strip ── */}
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

        {/* System Active Marker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>SYSTEM:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>ACTIVE</strong>
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Current Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>CURRENT PRICE:</span>{' '}
          <PriceTicker price={btcPrice} />
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Active Pool */}
        <div>
          <span style={{ color: 'var(--text-muted)' }}>ACTIVE POOL:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {(Number(activeTotalPool) / 1e18).toFixed(2)} USDC
          </strong>
        </div>
      </div>

      {/* ── Main Layout Workspace ── */}
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
            {/* Left Column (Chart + Activity) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TradingPanel
                  btcPrice={btcPrice}
                  activeBets={activeBets}
                  activeTotalPool={activeTotalPool}
                  activeUpPercent={activeUpPercent}
                  activeDownPercent={activeDownPercent}
                />
              </div>
              <div style={{ flexShrink: 0, minHeight: 0 }}>
                <PositionsTable />
              </div>
            </div>

            {/* Right Column (Unified Sidebar) */}
            <div
              style={{
                height: '100%',
                overflowY: 'auto',
                minHeight: 0,
                paddingRight: 4,
              }}
              className="custom-scrollbar"
            >
              <BettingPanel currentBtcPrice={btcPrice} />
            </div>
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
