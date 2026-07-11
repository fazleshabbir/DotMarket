'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from './ConnectButton';
import { GlobalRoundTimer } from './GlobalRoundTimer';
import { StatusBadge } from './trade/StatusBadge';
import { PriceTicker } from './trade/PriceTicker';
import { useMarket } from '@/lib/marketStore';

// ── SVG Icon Primitives ──────────────────────────────────────────────────────
const LockIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ── Animated number that transitions smoothly on change ──────────────────────
function AnimatedValue({ value, prefix = '', suffix = '', decimals = 2 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (Math.abs(value - displayValue) > 0.0001) {
      setFlash(true);
      const t = setTimeout(() => {
        setDisplayValue(value);
        setFlash(false);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [value, displayValue]);

  return (
    <span style={{
      transition: 'opacity 80ms ease',
      opacity: flash ? 0.5 : 1,
      fontFamily: 'var(--font-mono)',
    }}>
      {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

export function BettingPanel({ currentBtcPrice: _unusedProps }: { currentBtcPrice: number }) {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch unified context from Global Market Engine ───────────────────────
  const {
    btcPrice,
    twap,
    walletBalance,
    balanceSymbol,
    currentRoundId,
    activeRound,
    activeUserBet,
    activeTotalPool,
    activeUpPercent,
    activeDownPercent,
    activeUpMultiplier,
    activeDownMultiplier,
    prevRound,
    prevUserBet,
    prevTotalPool,
    prevUpPercent,
    prevDownPercent,
    prevUpMultiplier,
    prevDownMultiplier,
    isClaimable,
    marketStatus,
  } = useMarket();

  const hasPlacedActiveBet = !!(activeUserBet && activeUserBet.amount > 0n);
  const hasPlacedPrevBet = !!(prevUserBet && prevUserBet.amount > 0n);

  // Write contract actions
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setTxStatus('Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('Operation successful!');
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  const handlePlaceBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [currentRoundId, position],
        value: parseEther(betAmount),
        gas: 1000000n,
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClaim = () => {
    const prevRoundId = currentRoundId > 1n ? currentRoundId - 1n : 0n;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'claim',
        args: [prevRoundId],
        gas: 1000000n,
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // State indicators matching rules
  const canBet = isConnected && marketStatus === 'OPEN' && !hasPlacedActiveBet && !isPending && !isConfirming;
  const isWorking = isPending || isConfirming;
  const isMarketLocked = isConnected && !canBet && !isWorking;

  // Potential Return & Profit calculations while typing
  const stakeAmount = parseFloat(betAmount) || 0;
  const potentialUpReturn = stakeAmount > 0 && activeUpMultiplier > 0 ? stakeAmount * activeUpMultiplier : 0;
  const potentialDownReturn = stakeAmount > 0 && activeDownMultiplier > 0 ? stakeAmount * activeDownMultiplier : 0;
  const potentialUpProfit = potentialUpReturn - stakeAmount;
  const potentialDownProfit = potentialDownReturn - stakeAmount;

  // Previous Round Outcome calculations
  const getPrevOutcome = (): { text: string; color: string; userText?: string; userColor?: string } => {
    if (!prevRound) return { text: '—', color: 'var(--text-muted)' };
    if (!prevRound.resolved && !prevRound.canceled) return { text: 'LIVE MOVEMENT', color: '#ffffff' };
    if (prevRound.canceled) return { text: 'CANCELED', color: 'var(--text-muted)', userText: 'REFUNDED', userColor: '#ffffff' };

    const upWins = prevRound.closePrice > prevRound.startPrice;
    const downWins = prevRound.closePrice < prevRound.startPrice;
    const outcomeText = upWins ? '▲ UP WINS' : downWins ? '▼ DOWN WINS' : 'DRAW';
    const outcomeColor = '#ffffff';

    let userText: string | undefined;
    let userColor: string | undefined;
    if (hasPlacedPrevBet && prevUserBet) {
      const won = (upWins && prevUserBet.position === 0) || (downWins && prevUserBet.position === 1);
      const tie = !upWins && !downWins;
      userText = tie ? 'DRAW' : won ? 'WINNER' : 'LOST';
      userColor = tie ? 'var(--text-secondary)' : won ? '#ffffff' : 'rgba(255,255,255,0.4)';
    }

    return { text: outcomeText, color: outcomeColor, userText, userColor };
  };

  const outcome = getPrevOutcome();

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
      
      {/* ─── CARD 1: PLACE BET (Merged & Minimized) ───────────────────────── */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22,
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>PLACE BET</span>
            <StatusBadge status={marketStatus === 'LOCKED' || marketStatus === 'SETTLING' ? 'locked' : 'ready'} label={marketStatus} />
          </div>

          {/* BTC Price feed sub-header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>BTC/USD</span>
            <PriceTicker price={btcPrice} />
          </div>

          {/* Shared Countdown Timer — Always mounted, never hidden */}
          <div style={{ marginBottom: 10 }}>
            <GlobalRoundTimer />
          </div>

          {/* Locked State Notification overlay details */}
          {isMarketLocked && marketStatus !== 'OPEN' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 10,
              }}
            >
              <LockIcon size={14} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                BETTING CLOSED · CURRENTLY {marketStatus}
              </span>
            </div>
          )}

          {/* Wallet Balance Display inside the Place Bet card */}
          {isConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                AVAILABLE BALANCE
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                <AnimatedValue value={walletBalance} decimals={4} suffix={` ${balanceSymbol}`} />
              </span>
            </div>
          )}

          {/* Amount input */}
          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>Ξ</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!canBet || isWorking}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 24px',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    color: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Percentage triggers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      // Set fraction of walletBalance
                      const val = walletBalance * (pct / 100);
                      setBetAmount(val > 0.0001 ? val.toFixed(4) : '0.00');
                    }}
                    disabled={!canBet || isWorking}
                    style={{
                      padding: '4px 0',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}><ConnectButton /></div>
          )}

          {/* Live multipliers and potential returns details inside the Place Bet card */}
          {isConnected && stakeAmount > 0 && (activeUpMultiplier > 0 || activeDownMultiplier > 0) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 8,
              }}
            >
              {/* Multiplier Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>MULTIPLIER</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    ▲ <AnimatedValue value={activeUpMultiplier} decimals={2} suffix="×" />
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                    ▼ <AnimatedValue value={activeDownMultiplier} decimals={2} suffix="×" />
                  </span>
                </div>
              </div>
              {/* Potential Return Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>POTENTIAL RETURN</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    ▲ <AnimatedValue value={potentialUpReturn} decimals={4} suffix={` ${balanceSymbol}`} />
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                    ▼ <AnimatedValue value={potentialDownReturn} decimals={4} suffix={` ${balanceSymbol}`} />
                  </span>
                </div>
              </div>
              {/* Potential Profit Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>POTENTIAL PROFIT</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: potentialUpProfit >= 0 ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
                    ▲ {potentialUpProfit >= 0 ? '+' : ''}<AnimatedValue value={potentialUpProfit} decimals={4} suffix={` ${balanceSymbol}`} />
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: potentialDownProfit >= 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)' }}>
                    ▼ {potentialDownProfit >= 0 ? '+' : ''}<AnimatedValue value={potentialDownProfit} decimals={4} suffix={` ${balanceSymbol}`} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Default Multiplier Display */}
          {isConnected && stakeAmount === 0 && (activeUpMultiplier > 0 || activeDownMultiplier > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>CURRENT MULTIPLIER</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  ▲ <AnimatedValue value={activeUpMultiplier} decimals={2} suffix="×" />
                </span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                  ▼ <AnimatedValue value={activeDownMultiplier} decimals={2} suffix="×" />
                </span>
              </div>
            </div>
          )}

          {/* Live Pool Share Stats */}
          {isConnected && activeTotalPool > 0n && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>POOL DISTRIBUTION</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>▲ {activeUpPercent.toFixed(0)}%</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>▼ {activeDownPercent.toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isConnected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => handlePlaceBet(0)}
                disabled={!canBet || isWorking || !betAmount}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 10,
                  height: 30,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                ▲ UP
              </button>
              <button
                onClick={() => handlePlaceBet(1)}
                disabled={!canBet || isWorking || !betAmount}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 10,
                  height: 30,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                ▼ DOWN
              </button>
            </div>

            {txStatus && (
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                {txStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 2: LIVE MARKET (Upgraded Previous Market) ───────────────── */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22,
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>LIVE MARKET</span>
            <StatusBadge
              status={marketStatus === 'LOCKED' || marketStatus === 'SETTLING' ? 'live' : 'settled'}
              label={marketStatus}
            />
          </div>

          {/* Shared Countdown Timer — Always mounted, never hidden, perfectly synchronized */}
          <div style={{ marginBottom: 10 }}>
            <GlobalRoundTimer />
          </div>

          {/* Round detail stats */}
          {activeRound && (marketStatus === 'OPEN' || marketStatus === 'LOCKED' || marketStatus === 'SETTLING') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* BTC Current Price vs Entry (startPrice) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>BTC PRICE</span>
                  <PriceTicker price={btcPrice} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>ENTRY PRICE</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                    ${(Number(activeRound.startPrice) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* TWAP Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CURRENT TWAP</span>
                <span style={{ color: '#ffffff' }}>
                  ${twap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Pool size */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>POOL SIZE</span>
                <span style={{ color: '#ffffff' }}>
                  {activeTotalPool > 0n ? `${(Number(activeTotalPool) / 1e18).toFixed(4)} ${balanceSymbol}` : `0.0000 ${balanceSymbol}`}
                </span>
              </div>

              {/* UP % vs DOWN % */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>UP % / DOWN %</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#ffffff' }}>▲ {activeUpPercent.toFixed(0)}%</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {activeDownPercent.toFixed(0)}%</span>
                </div>
              </div>

              {/* UP Multiplier vs DOWN Multiplier */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>UP / DOWN MULTIPLIERS</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#ffffff' }}>▲ {activeUpMultiplier.toFixed(2)}×</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {activeDownMultiplier.toFixed(2)}×</span>
                </div>
              </div>
            </div>
          ) : (
            // Previous settled details
            prevRound && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 10px' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>WINNING SIDE</span>
                  <strong style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{outcome.text}</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>ENTRY PRICE</span>
                    <span style={{ color: '#ffffff' }}>${(Number(prevRound.startPrice) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CLOSE PRICE</span>
                    <span style={{ color: '#ffffff' }}>${(Number(prevRound.closePrice) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>POOL SIZE</span>
                    <span style={{ color: '#ffffff' }}>{(Number(prevRound.totalUpAmount + prevRound.totalDownAmount) / 1e18).toFixed(4)} {balanceSymbol}</span>
                  </div>

                  {prevTotalPool > 0n && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>DISTRIBUTION</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#ffffff' }}>▲ {prevUpPercent.toFixed(0)}%</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {prevDownPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}

                  {(prevUpMultiplier > 0 || prevDownMultiplier > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>MULTIPLIERS</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#ffffff' }}>▲ {prevUpMultiplier.toFixed(2)}×</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {prevDownMultiplier.toFixed(2)}×</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Claim actions for settled payouts */}
        {!(marketStatus === 'OPEN' || marketStatus === 'LOCKED' || marketStatus === 'SETTLING') && hasPlacedPrevBet && prevUserBet && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>YOUR BET</span>
              <span style={{ color: '#ffffff' }}>
                {(Number(prevUserBet.amount) / 1e18).toFixed(4)} {balanceSymbol} · {prevUserBet.position === 0 ? 'UP' : 'DOWN'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>RESULT</span>
              <strong style={{ color: outcome.userColor || '#ffffff' }}>{outcome.userText || 'LOST'}</strong>
            </div>

            {isClaimable && !prevUserBet.claimed && (
              <button
                onClick={handleClaim}
                disabled={isWorking}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 10,
                  height: 30,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                CLAIM WINNINGS
              </button>
            )}

            {prevUserBet.claimed && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 9,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  padding: '4px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 8,
                }}
              >
                ✓ PAYOUT CLAIMED
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
