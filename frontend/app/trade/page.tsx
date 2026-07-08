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

export default function TradePage() {
  const { isConnected } = useAccount();
  const [btcPrice, setBtcPrice] = useState(62000.0);

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

  // Fetch live price from Pyth Hermes API
  useEffect(() => {
    const fetchPythPrice = async () => {
      try {
        const feedId = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`);
        const data = await res.json();
        if (data && data.parsed && data.parsed[0]) {
          const priceObj = data.parsed[0].price;
          const realPrice = Number(priceObj.price) * Math.pow(10, priceObj.expo);
          setBtcPrice(realPrice);
        }
      } catch (err) {
        console.error('Error fetching Pyth price:', err);
      }
    };

    fetchPythPrice(); // Initial fetch
    const interval = setInterval(fetchPythPrice, 3000); // Fetch every 3 seconds
    return () => clearInterval(interval);
  }, []);

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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 200 60" width="130" height="39" xmlns="http://www.w3.org/2000/svg">
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
          <span style={{ color: 'var(--text-muted)' }}>ACTIVE ROUND:</span>{' '}
          <strong style={{ color: '#ffffff' }}>#{roundId.toString()}</strong>
        </div>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        <div>
          <span style={{ color: 'var(--text-muted)' }}>ROUND POOL:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {round ? `${(Number(round.totalUpAmount + round.totalDownAmount) / 1e18).toFixed(4)} ETH` : '0.00 ETH'}
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
