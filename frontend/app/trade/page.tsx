'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BettingPanel } from '@/components/BettingPanel';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { TradeHeader } from '@/components/trade/TradeHeader';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { PriceTicker } from '@/components/trade/PriceTicker';
import { PositionsTable } from '@/components/PositionsTable';
import { MarketProvider, useMarket } from '@/lib/marketStore';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { PortfolioView } from '@/components/trade/PortfolioView';
import { LeaderboardView } from '@/components/trade/LeaderboardView';

function CountdownText() {
  const { timeLeftToLock, timeLeftToEnd, marketStatus } = useMarket();

  const timeLeft = marketStatus === 'OPEN' ? timeLeftToLock : timeLeftToEnd;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (marketStatus === 'SETTLING') {
    return <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>SETTLING</strong>;
  }
  if (marketStatus === 'NEXT ROUND') {
    return <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>0:00</strong>;
  }
  if (marketStatus === 'AWAITING PLAYERS') {
    return <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>—:—</strong>;
  }

  return (
    <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
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
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: 'var(--text-1)',
        textAlign: 'center',
        position: 'relative',
        overflowX: 'clip',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="animate-float-laptop" style={{ marginBottom: '32px' }}>
          <svg viewBox="0 0 200 120" width="160" height="96" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>
            </defs>
            <rect x="30" y="20" width="140" height="80" rx="6" fill="url(#laptopScreenGrad)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
            <rect x="35" y="25" width="130" height="70" rx="3" fill="#050505" />
            <line x1="35" y1="48" x2="165" y2="48" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="35" y1="72" x2="165" y2="72" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="78" y1="25" x2="78" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="122" y1="25" x2="122" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <path d="M 40 75 Q 65 40 90 60 T 130 35 T 160 55" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="160" cy="55" r="2.5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }} />
            <path d="M 12 100 L 188 100 L 176 110 L 24 110 Z" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
            <rect x="85" y="101" width="30" height="6" rx="1.5" fill="rgba(255, 255, 255, 0.12)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
          </svg>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '30px',
          fontWeight: 400,
          color: 'var(--text-1)',
          margin: '0 0 12px',
          letterSpacing: '-0.5px',
        }}>
          Desktop Only
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-2)',
          lineHeight: 1.65,
          margin: '0 0 32px',
          fontWeight: 400,
        }}>
          DotMarket's trading terminal is optimized for desktop. Mobile trading is coming soon.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }}>
              Back to Home
            </Button>
          </Link>
          <Button onClick={handleCopy} variant="secondary" size="md" style={{ width: '100%' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy Link for Desktop'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TerminalClient() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState('Live Market');
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleClaim = (roundId: bigint) => {
    writeContract({
      address: MARKET_ADDRESS,
      abi: ROUND_MARKET_ABI,
      functionName: 'claim',
      args: [roundId],
    });
  };

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
    <div style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-1)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      <TradeHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Market Info Bar ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 20px',
        margin: '8px 20px 0 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid var(--border-2)',
        height: 36,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}>
        {/* Pair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16 }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>BTC/USD</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'var(--border-2)', marginRight: 16, flexShrink: 0 }} />

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 16 }}>
          <div className="animate-pulse-live" style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffffff', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{marketStatus}</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'var(--border-2)', marginRight: 16, flexShrink: 0 }} />

        {/* Time Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 16 }}>
          <span style={{ color: 'var(--text-3)' }}>TIME</span>
          <CountdownText />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'var(--border-2)', marginRight: 16, flexShrink: 0 }} />

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 16 }}>
          <span style={{ color: 'var(--text-3)' }}>PRICE</span>
          <PriceTicker price={btcPrice} />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'var(--border-2)', marginRight: 16, flexShrink: 0 }} />

        {/* Pool */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-3)' }}>POOL</span>
          <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{poolSize} {balanceSymbol}</strong>
        </div>
      </div>

      {/* ── Live Market View ──────────────────────────────────────────────── */}
      <div style={{
        display: activeTab === 'Live Market' ? 'flex' : 'none',
        flex: 1,
        padding: '10px 20px 16px 20px',
        gap: 12,
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Left: Chart + Positions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: '6 1 0', minHeight: 0 }}>
            <TradingPanel />
          </div>
          <div style={{ flex: '4 1 0', minHeight: 0 }}>
            <PositionsTable />
          </div>
        </div>

        {/* Right: Betting Panel */}
        <div style={{ width: '364px', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          <BettingPanel currentBtcPrice={btcPrice} />
        </div>
      </div>

      {/* ── Other Views: Portfolio, Leaderboard ───────────────────────────── */}
      <div style={{
        display: activeTab !== 'Live Market' ? 'flex' : 'none',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {activeTab === 'Portfolio' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px 20px' }}>
            <PortfolioView onClaim={handleClaim} claimPending={isConfirming} />
          </div>
        )}
        {activeTab === 'Leaderboard' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 20px 20px 20px' }}>
            <LeaderboardView />
          </div>
        )}
      </div>
    </div>
  );
}

// Disable SSR for the entire trading terminal to prevent hydration mismatch from Date.now()
const DynamicTerminalClient = dynamic(() => Promise.resolve(TerminalClient), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>LOADING TERMINAL…</div>
    </div>
  )
});

export default function TradePage() {
  return <DynamicTerminalClient />;
}
