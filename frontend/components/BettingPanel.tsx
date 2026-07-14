'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from './ConnectButton';
import { GlobalRoundTimer } from './GlobalRoundTimer';
import { StatusBadge } from './trade/StatusBadge';
import { PriceTicker } from './trade/PriceTicker';
import { useMarket } from '@/lib/marketStore';
import { LockIcon } from './ui/LockIcon';

// ── Premium Rolling Digit Number Component ──────────────────────────────────
function RollingNumber({ value, decimals = 2, prefix = '', suffix = '' }: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const str = value.toFixed(decimals);
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {prefix && <span>{prefix}</span>}
      {str.split('').map((char, idx) => {
        if (char >= '0' && char <= '9') {
          const val = parseInt(char);
          return (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                height: '1.2em',
                lineHeight: '1.2em',
                overflow: 'hidden',
                position: 'relative',
                width: '0.54em',
                textAlign: 'center',
                verticalAlign: 'bottom',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(-${val * 10}%)`,
                  transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} style={{ height: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        }
        return <span key={idx} style={{ display: 'inline-block', width: char === '.' ? '0.22em' : 'auto', textAlign: 'center', verticalAlign: 'bottom' }}>{char}</span>;
      })}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

// ── Premium Button Spinner Component ────────────────────────────────────────
const ButtonSpinner = ({ dark = false }: { dark?: boolean }) => (
  <svg
    style={{
      marginRight: 6,
      display: 'inline-block',
      verticalAlign: 'middle',
      animation: 'spin 1s linear infinite',
    }}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
  >
    <circle cx="12" cy="12" r="10" stroke={dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"} />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={dark ? "#000000" : "#ffffff"} strokeLinecap="round" />
  </svg>
);

// ── Smooth Fading Live Status Transition (Winning / Losing) ──────────────────
function LiveStatusTransition({ status }: { status: string }) {
  const [displayStatus, setDisplayStatus] = useState(status);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (status !== displayStatus) {
      setOpacity(0);
      const t = setTimeout(() => {
        setDisplayStatus(status);
        setOpacity(1);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [status, displayStatus]);

  return (
    <span style={{
      opacity,
      transition: 'opacity 100ms ease-in-out',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {displayStatus}
    </span>
  );
}

export function BettingPanel({ currentBtcPrice: _unusedProps }: { currentBtcPrice: number }) {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // States to handle button micro-interactions
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [depressedButton, setDepressedButton] = useState<number | null>(null);
  const [localSelectedButton, setLocalSelectedButton] = useState<number | null>(null);

  // States to handle Bet Confirmation Overlay
  const [betConfirmedDetails, setBetConfirmedDetails] = useState<{
    show: boolean;
    direction: string;
    amount: string;
    multiplier: string;
    round: string;
  } | null>(null);

  // States to handle settled outcome overlays
  const [lastOutcomeShownRoundId, setLastOutcomeShownRoundId] = useState<string>('');
  const [outcomeDetails, setOutcomeDetails] = useState<{
    show: boolean;
    title: string;
    amountStr: string;
    details: string;
  } | null>(null);

  // Keep track of the active bet details to show Toast on success
  const pendingBetDetails = useRef<{ position: number; amount: string } | null>(null);

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
    pastRound,
    pastUserBet,
    pastMultipliers,
    isClaimable,
    marketStatus,
    prevMarketStatus,
    triggerToast,
    timeLeftToLock,
  } = useMarket();

  const hasPlacedActiveBet = !!(activeUserBet && activeUserBet.amount > 0n);

  // Swap Card 2 target round dynamically when the active round locks/settles locally
  const isCurrentRoundClosed = marketStatus === 'LOCKED' || marketStatus === 'SETTLING';

  // lockedEntryPrice is now sourced from the central market store (on-chain startPrice)
  const { lockedEntryPrice } = useMarket();

  const liveRound = isCurrentRoundClosed ? activeRound : prevRound;
  const liveUserBet = isCurrentRoundClosed ? activeUserBet : prevUserBet;
  const liveTotalPool = isCurrentRoundClosed ? activeTotalPool : prevTotalPool;
  const liveUpMultiplier = isCurrentRoundClosed ? activeUpMultiplier : prevUpMultiplier;
  const liveDownMultiplier = isCurrentRoundClosed ? activeDownMultiplier : prevDownMultiplier;
  const liveMarketStatusStr = isCurrentRoundClosed ? marketStatus : prevMarketStatus;
  const liveUpPercent = isCurrentRoundClosed ? activeUpPercent : prevUpPercent;
  const liveDownPercent = isCurrentRoundClosed ? activeDownPercent : prevDownPercent;
  const hasPlacedPrevBet = isCurrentRoundClosed ? hasPlacedActiveBet : !!(prevUserBet && prevUserBet.amount > 0n);

  // Write contract actions
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Handle transaction confirmation notifications
  useEffect(() => {
    if (isPending) setTxStatus('Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('Operation successful!');
      
      // Trigger Prediction Submitted Local Premium Toast Overlay
      if (pendingBetDetails.current) {
        const betDir = pendingBetDetails.current.position === 0 ? '▲ UP' : '▼ DOWN';
        const mult = pendingBetDetails.current.position === 0 ? activeUpMultiplier : activeDownMultiplier;
        
        // Activate Local Bet Accepted Overlay
        setBetConfirmedDetails({
          show: true,
          direction: pendingBetDetails.current.position === 0 ? 'UP' : 'DOWN',
          amount: `${pendingBetDetails.current.amount} ${balanceSymbol}`,
          multiplier: `${mult.toFixed(2)}×`,
          round: `Round #${currentRoundId.toString()}`,
        });

        // Trigger global fallback toast as backup
        triggerToast(
          '✓ Prediction Submitted',
          `${betDir} · ${pendingBetDetails.current.amount} ${balanceSymbol} · ${mult.toFixed(2)}× · Entry: $${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          'success'
        );

        pendingBetDetails.current = null;
        setLocalSelectedButton(null);

        // Auto-dismiss local overlay after 2 seconds
        setTimeout(() => {
          setBetConfirmedDetails(null);
        }, 2000);
      }
      
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  // Result auto-check is handled centrally by MarketProvider (marketStore.tsx)
  // No duplicate useEffect needed here

  const handlePlaceBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    pendingBetDetails.current = { position, amount: betAmount };
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
      setLocalSelectedButton(null);
      setDepressedButton(null);
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
  const canBet = isConnected && marketStatus === 'OPEN' && !isPending && !isConfirming;
  const isWorking = isPending || isConfirming;
  const isMarketLocked = isConnected && !canBet && !isWorking;

  // Potential Return & Profit calculations while typing
  const stakeAmount = parseFloat(betAmount) || 0;
  const potentialUpReturn = stakeAmount > 0 && activeUpMultiplier > 0 ? stakeAmount * activeUpMultiplier : 0;
  const potentialDownReturn = stakeAmount > 0 && activeDownMultiplier > 0 ? stakeAmount * activeDownMultiplier : 0;

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

  // Check if prev round is currently locked/live in settlement cycle
  const isPrevRoundLive = !!(liveRound && (liveMarketStatusStr === 'LOCKED' || liveMarketStatusStr === 'SETTLING'));

  // Settlement animation progress bar helpers
  const showSettlingProgress = liveMarketStatusStr === 'SETTLING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box', position: 'relative', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* CSS Pulse glow declarations */}
      <style>{`
        @keyframes cardPulseGlow {
          0% { border-color: rgba(255, 255, 255, 0.2); box-shadow: 0 0 15px rgba(255, 255, 255, 0.04); }
          50% { border-color: rgba(255, 255, 255, 0.55); box-shadow: 0 0 35px rgba(255, 255, 255, 0.18), inset 0 0 15px rgba(255, 255, 255, 0.02); }
          100% { border-color: rgba(255, 255, 255, 0.2); box-shadow: 0 0 15px rgba(255, 255, 255, 0.04); }
        }
        @keyframes buttonPulseGlow {
          0% { box-shadow: 0 0 8px rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.6); }
          50% { box-shadow: 0 0 16px rgba(255, 255, 255, 0.35); border-color: rgba(255, 255, 255, 0.95); }
          100% { box-shadow: 0 0 8px rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.6); }
        }
        @keyframes settlingProgressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scanProgress {
          0% { left: -30%; }
          100% { left: 100%; }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(0.9); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ─── CARD 1: PLACE BET (Merged & Minimized) ───────────────────────── */}
      <div
        style={{
          flex: '0 0 auto',
          minHeight: '340px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22,
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* local Bet Accepted overlay */}
        {betConfirmedDetails?.show && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.93)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            animation: 'fadeIn 200ms ease-in-out forwards',
            transform: 'scale(1)',
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            padding: 16
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#ffffff' }}>✓ BET ACCEPTED</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                {betConfirmedDetails.direction}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {betConfirmedDetails.amount}
              </span>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                <span>{betConfirmedDetails.multiplier}</span>
                <span>·</span>
                <span>{betConfirmedDetails.round}</span>
              </div>
            </div>
          </div>
        )}

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

          {/* Shared Countdown Timer — Always mounted, never hidden, continuously running for Active Round */}
          <div style={{ marginBottom: 10 }}>
            <GlobalRoundTimer target="active" />
          </div>



          {/* Wallet Balance Display inside the Place Bet card */}
          {isConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                AVAILABLE BALANCE
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                <RollingNumber value={walletBalance} decimals={4} suffix={` ${balanceSymbol}`} />
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

          {/* 50/50 Live Betting Meter (Minimal) */}
          {isConnected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: '10px 0 6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ffffff' }}>
                  UP <RollingNumber value={activeUpPercent} decimals={0} suffix="%" />
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'rgba(255, 255, 255, 0.55)' }}>
                  <RollingNumber value={activeDownPercent} decimals={0} suffix="%" /> DOWN
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  background: '#ffffff',
                  width: `${activeUpPercent}%`,
                  transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>
            </div>
          )}

          {/* Interactive Preview row (Replaces the multi-row data matrix) */}
          {isConnected && !isMarketLocked && (activeUpMultiplier > 0 || activeDownMultiplier > 0) && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              paddingTop: 8,
              marginTop: 6
            }}>
              {stakeAmount > 0 ? (
                <>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>EST. PAYOUT</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 600 }}>
                      ▲ <RollingNumber value={potentialUpReturn} decimals={4} />
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                      ▼ <RollingNumber value={potentialDownReturn} decimals={4} />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>MULTIPLIERS</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                      ▲ <RollingNumber value={activeUpMultiplier} decimals={2} suffix="×" />
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                      ▼ <RollingNumber value={activeDownMultiplier} decimals={2} suffix="×" />
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isConnected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* UP Button */}
              {(() => {
                const isSelectedOnChain = hasPlacedActiveBet && activeUserBet?.position === 0;
                const isPendingSelect = localSelectedButton === 0;
                const isDepressed = depressedButton === 0;
                const isHovered = hoveredButton === 0;

                let borderStyle: React.CSSProperties = {};
                if (isSelectedOnChain) {
                  borderStyle = {
                    border: '1px solid #ffffff',
                    boxShadow: '0 0 10px rgba(255,255,255,0.15)',
                    animation: 'buttonPulseGlow 3.5s infinite ease-in-out',
                  };
                } else {
                  borderStyle = {
                    border: isHovered ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                  };
                }

                return (
                  <button
                    onMouseEnter={() => setHoveredButton(0)}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => {
                      if (!canBet || !betAmount) return;
                      setLocalSelectedButton(0);
                      setDepressedButton(0);
                      setTimeout(() => {
                        setDepressedButton(null);
                        handlePlaceBet(0);
                      }, 120);
                    }}
                    disabled={!canBet || isWorking || !betAmount || (hasPlacedActiveBet && activeUserBet?.position === 1)}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      fontWeight: 700,
                      fontSize: 11,
                      borderRadius: 10,
                      height: 30,
                      cursor: canBet && betAmount ? 'pointer' : 'default',
                      letterSpacing: '0.04em',
                      transition: 'transform 120ms ease, border-color 200ms ease, box-shadow 200ms ease',
                      transform: isDepressed ? 'scale(0.96)' : (isHovered && canBet && betAmount ? 'scale(1.02)' : 'scale(1)'),
                      ...borderStyle,
                    }}
                  >
                    {isWorking && isPendingSelect ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <ButtonSpinner dark={true} /> PLACING...
                      </span>
                    ) : isSelectedOnChain ? (
                      '✓ UP'
                    ) : (
                      '▲ UP'
                    )}
                  </button>
                );
              })()}

              {/* DOWN Button */}
              {(() => {
                const isSelectedOnChain = hasPlacedActiveBet && activeUserBet?.position === 1;
                const isPendingSelect = localSelectedButton === 1;
                const isDepressed = depressedButton === 1;
                const isHovered = hoveredButton === 1;

                let borderStyle: React.CSSProperties = {};
                if (isSelectedOnChain) {
                  borderStyle = {
                    border: '1px solid #ffffff',
                    boxShadow: '0 0 10px rgba(255,255,255,0.15)',
                    animation: 'buttonPulseGlow 3.5s infinite ease-in-out',
                  };
                } else {
                  borderStyle = {
                    border: isHovered ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.2)',
                  };
                }

                return (
                  <button
                    onMouseEnter={() => setHoveredButton(1)}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => {
                      if (!canBet || !betAmount) return;
                      setLocalSelectedButton(1);
                      setDepressedButton(1);
                      setTimeout(() => {
                        setDepressedButton(null);
                        handlePlaceBet(1);
                      }, 120);
                    }}
                    disabled={!canBet || isWorking || !betAmount || (hasPlacedActiveBet && activeUserBet?.position === 0)}
                    style={{
                      background: 'transparent',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 11,
                      borderRadius: 10,
                      height: 30,
                      cursor: canBet && betAmount ? 'pointer' : 'default',
                      letterSpacing: '0.04em',
                      transition: 'transform 120ms ease, border-color 200ms ease, box-shadow 200ms ease',
                      transform: isDepressed ? 'scale(0.96)' : (isHovered && canBet && betAmount ? 'scale(1.02)' : 'scale(1)'),
                      ...borderStyle,
                    }}
                  >
                    {isWorking && isPendingSelect ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <ButtonSpinner dark={false} /> PLACING...
                      </span>
                    ) : isSelectedOnChain ? (
                      '✓ DOWN'
                    ) : (
                      '▼ DOWN'
                    )}
                  </button>
                );
              })()}
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
          flex: '0 0 auto',
          minHeight: '270px',
          background: hasPlacedPrevBet 
            ? 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.075) 0%, rgba(255, 255, 255, 0.015) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderStyle: 'solid',
          borderWidth: 1,
          borderRadius: 22,
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          borderColor: hasPlacedPrevBet ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.05)',
          boxShadow: hasPlacedPrevBet ? '0 0 25px rgba(255, 255, 255, 0.1)' : 'none',
          animation: hasPlacedPrevBet ? 'cardPulseGlow 2s infinite ease-in-out' : 'none',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>LIVE MARKET</span>
              {hasPlacedPrevBet && isPrevRoundLive && (
                <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>YOUR BET IS LIVE</span>
              )}
            </div>
            {hasPlacedPrevBet && isPrevRoundLive ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 20,
                border: '1px solid #ffffff',
                color: '#ffffff',
                fontSize: 8,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
              }}>
                ACTIVE
              </span>
            ) : (
              <StatusBadge
                status={isPrevRoundLive ? 'live' : 'settled'}
                label={isPrevRoundLive ? 'LIVE' : 'SETTLED'}
              />
            )}
          </div>

          {/* Shared Countdown Timer — Displays only when user has placed a bet on the running round */}
          {hasPlacedPrevBet && isPrevRoundLive ? (
            <div style={{ marginBottom: 10 }}>
              <GlobalRoundTimer target="prev" />
            </div>
          ) : hasPlacedActiveBet && marketStatus === 'OPEN' ? (
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              padding: '14px 12px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 0 12px rgba(255, 255, 255, 0.02)',
              marginBottom: 10,
              overflow: 'hidden'
            }}>
              {/* Scanline light bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '40%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
                animation: 'scanProgress 2s infinite linear',
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {activeUserBet && activeUserBet.position === 0 ? '▲ UP' : '▼ DOWN'} · {activeUserBet ? (Number(activeUserBet.amount) / 1e18).toFixed(4) : '0.00'} {balanceSymbol}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
                  animation: 'pulseGlow 1.5s infinite ease-in-out',
                }} />
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  Prediction Active · Waiting for lock
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '16px 12px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px dashed rgba(255, 255, 255, 0.06)',
              marginBottom: 10,
              overflow: 'hidden'
            }}>
              {/* Scanline light bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '30%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
                animation: 'scanProgress 3s infinite linear',
              }} />
              
              {/* Mini radar pulse indicator */}
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.2)',
                animation: 'pulseGlow 2s infinite ease-in-out',
              }} />
              
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.35)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Waiting for prediction...
              </span>
            </div>
          )}


          {/* Upgraded & Simplified Round detail stats */}
          {liveRound && (liveMarketStatusStr === 'OPEN' || liveMarketStatusStr === 'LOCKED' || liveMarketStatusStr === 'SETTLING') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* BTC Current Price vs Entry Price stack */}
              {(() => {
                const rawStartPrice = liveRound ? Number(liveRound.startPrice) : 0;
                const entryPx = rawStartPrice > 0 
                  ? rawStartPrice / 1e8 
                  : (lockedEntryPrice > 0 ? lockedEntryPrice : btcPrice);
                const diff = btcPrice - entryPx;
                const activeStatus = liveMarketStatusStr === 'SETTLING' ? 'SETTLING' : (btcPrice > entryPx ? 'BULLISH ▲' : btcPrice < entryPx ? 'BEARISH ▼' : 'FLAT');

                if (!hasPlacedPrevBet) return null;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Entry Price</span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 700 }}>
                        ${entryPx.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: '6px 8px',
                      background: 'rgba(255,255,255,0.01)'
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Current Price</span>
                      <PriceTicker price={btcPrice} />
                    </div>

                    {hasPlacedPrevBet && liveUserBet && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: 5, marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Your Position</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                            {liveUserBet.position === 0 ? '▲ UP' : '▼ DOWN'} · {(Number(liveUserBet.amount) / 1e18).toFixed(4)} {balanceSymbol}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Live Status</span>
                          <strong style={{ fontSize: 13, color: '#ffffff' }}>
                            <LiveStatusTransition status={activeStatus} />
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Est. Profit</span>
                          {(() => {
                            const won = (btcPrice > entryPx && liveUserBet.position === 0) || (btcPrice < entryPx && liveUserBet.position === 1);
                            const mult = liveUserBet.position === 0 ? liveUpMultiplier : liveDownMultiplier;
                            const betAmt = Number(liveUserBet.amount) / 1e18;
                            const pnl = won ? (betAmt * (mult - 1)) : -betAmt;
                            return (
                              <strong style={{
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                color: pnl >= 0 ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                transition: 'color 200ms ease'
                              }}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} {balanceSymbol} ({mult.toFixed(2)}×)
                              </strong>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Show global stats ONLY when there is no active bet */}
              {!hasPlacedPrevBet && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {/* Prominent Potential Return Multipliers — matching Entry Price box */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                      POTENTIAL RETURN
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>▲ UP</span>
                      <strong style={{ fontSize: 13, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        <RollingNumber value={liveUpMultiplier > 0 ? liveUpMultiplier : 1.92} decimals={2} suffix="×" />
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>▼ DOWN</span>
                      <strong style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                        <RollingNumber value={liveDownMultiplier > 0 ? liveDownMultiplier : 2.08} decimals={2} suffix="×" />
                      </strong>
                    </div>
                  </div>

                  {/* Secondary Pool Size */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>POOL SIZE</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                      {liveTotalPool > 0n ? `${(Number(liveTotalPool) / 1e18).toFixed(4)} ${balanceSymbol}` : `0.0000 ${balanceSymbol}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Previous settled details
            prevRound && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hasPlacedPrevBet && prevUserBet ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    marginBottom: 4
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Your Position</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {prevUserBet.position === 0 ? '▲ UP' : '▼ DOWN'} · {(Number(prevUserBet.amount) / 1e18).toFixed(4)} {balanceSymbol}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Outcome</span>
                      {(() => {
                        const upWins = prevRound.closePrice > prevRound.startPrice;
                        const downWins = prevRound.closePrice < prevRound.startPrice;
                        const won = !prevRound.canceled && ((upWins && prevUserBet.position === 0) || (downWins && prevUserBet.position === 1));
                        const refund = prevRound.canceled;

                        if (refund) {
                          return <strong style={{ fontSize: 13, color: '#ffffff' }}>REFUNDED</strong>;
                        } else if (won) {
                          const mult = prevUserBet.position === 0 ? prevUpMultiplier : prevDownMultiplier;
                          const payout = (Number(prevUserBet.amount) / 1e18) * mult;
                          return <strong style={{ fontSize: 13, color: '#ffffff' }}>WON (+{payout.toFixed(4)} {balanceSymbol})</strong>;
                        } else {
                          return <strong style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>LOST (-{(Number(prevUserBet.amount) / 1e18).toFixed(4)} {balanceSymbol})</strong>;
                        }
                      })()}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 10px' }}>
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>WINNING SIDE</span>
                    <strong style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{outcome.text}</strong>
                  </div>
                )}

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
                        <span style={{ color: '#ffffff' }}>▲ <RollingNumber value={prevUpPercent} decimals={0} suffix="%" /></span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ <RollingNumber value={prevDownPercent} decimals={0} suffix="%" /></span>
                      </div>
                    </div>
                  )}

                  {(prevUpMultiplier > 0 || prevDownMultiplier > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>MULTIPLIERS</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#ffffff' }}>▲ <RollingNumber value={prevUpMultiplier} decimals={2} suffix="×" /></span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ <RollingNumber value={prevDownMultiplier} decimals={2} suffix="×" /></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Claim actions for settled payouts */}
        {!(prevMarketStatus === 'OPEN' || prevMarketStatus === 'LOCKED' || prevMarketStatus === 'SETTLING') && hasPlacedPrevBet && prevUserBet && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>YOUR BET</span>
              <span style={{ color: '#ffffff' }}>
                {(Number(prevUserBet.amount) / 1e18).toFixed(4)} {balanceSymbol} · {prevUserBet.position === 0 ? 'UP' : 'DOWN'}
              </span>
            </div>
            
            {/* Show Result: 🏆 WON +23.00 USDC or LOST -20.00 USDC with smooth fade-in */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>RESULT</span>
              {(() => {
                const upWins = prevRound && prevRound.closePrice > prevRound.startPrice;
                const downWins = prevRound && prevRound.closePrice < prevRound.startPrice;
                const won = prevRound && !prevRound.canceled && ((upWins && prevUserBet.position === 0) || (downWins && prevUserBet.position === 1));
                const refund = prevRound && prevRound.canceled;

                if (refund) {
                  return <strong style={{ color: '#ffffff', animation: 'fadeIn 300ms ease' }}>REFUNDED (+{(Number(prevUserBet.amount) / 1e18).toFixed(2)} {balanceSymbol})</strong>;
                } else if (won) {
                  const mult = prevUserBet.position === 0 ? prevUpMultiplier : prevDownMultiplier;
                  const payout = (Number(prevUserBet.amount) / 1e18) * mult;
                  return <strong style={{ color: '#ffffff', animation: 'fadeIn 300ms ease' }}>WON (+{payout.toFixed(2)} {balanceSymbol})</strong>;
                } else {
                  return <strong style={{ color: 'rgba(255,255,255,0.4)', animation: 'fadeIn 300ms ease' }}>LOST (-{(Number(prevUserBet.amount) / 1e18).toFixed(2)} {balanceSymbol})</strong>;
                }
              })()}
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

        {/* Settled Outcome Modal Overlay inside Card 2 */}
        {outcomeDetails?.show && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            animation: 'fadeIn 200ms ease-in-out forwards',
            padding: 16
          }}>
            {/* Close Icon button */}
            <button
              onClick={() => setOutcomeDetails(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: 14,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              ✕
            </button>

            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: '#ffffff' }}>
              {outcomeDetails.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                {outcomeDetails.amountStr}
              </span>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {outcomeDetails.details}
              </div>
            </div>

            {outcomeDetails.title === 'WON' && (
              <button
                onClick={() => {
                  handleClaim();
                  setOutcomeDetails(null);
                }}
                disabled={isWorking}
                style={{
                  marginTop: 12,
                  padding: '6px 20px',
                  borderRadius: 10,
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: 11,
                  border: 'none',
                  cursor: isWorking ? 'wait' : 'pointer',
                  letterSpacing: '0.06em',
                  transition: 'opacity 0.2s ease',
                  opacity: isWorking ? 0.5 : 1,
                  textTransform: 'uppercase'
                }}
              >
                Claim Winnings
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
