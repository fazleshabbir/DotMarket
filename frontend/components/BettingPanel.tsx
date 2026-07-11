'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from './ConnectButton';
import { RoundTimer } from './RoundTimer';
import { StatusBadge } from './trade/StatusBadge';
import { PriceTicker } from './trade/PriceTicker';

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

interface BettingPanelProps {
  currentBtcPrice: number;
}

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

export function BettingPanel({ currentBtcPrice }: BettingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Wallet native token balance ──────────────────────────────────────────
  const { data: balanceData } = useBalance({
    address: address,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const walletBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const balanceSymbol = balanceData?.symbol || 'ETH';

  // 1. Read current round ID
  const { data: currentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 2000 },
  });

  const activeRoundId = currentRoundId ? BigInt(currentRoundId.toString()) : 0n;
  const prevRoundId = activeRoundId > 1n ? activeRoundId - 1n : 0n;

  // 2. Active Round Data
  const { data: activeRoundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });
  const activeRound = activeRoundData as unknown as RoundData | undefined;

  const { data: activeMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });

  const { data: activeUserBetData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [activeRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: activeRoundId > 0n && !!address, refetchInterval: 2000 },
  });
  const activeUserBet = activeUserBetData as unknown as { position: number; amount: bigint; claimed: boolean } | undefined;
  const hasPlacedActiveBet = !!(activeUserBet && activeUserBet.amount > 0n);

  // 3. Previous Round Data
  const { data: prevRoundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2000 },
  });
  const prevRound = prevRoundData as unknown as RoundData | undefined;

  const { data: prevMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2000 },
  });

  const { data: prevUserBetData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2000 },
  });
  const prevUserBet = prevUserBetData as unknown as { position: number; amount: bigint; claimed: boolean } | undefined;
  const hasPlacedPrevBet = !!(prevUserBet && prevUserBet.amount > 0n);

  const { data: isClaimable } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2000 },
  });

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
        args: [activeRoundId, position],
        value: parseEther(betAmount),
        gas: 1000000n,
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClaim = () => {
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

  // Calculations for Active Round
  const activeNow = Math.floor(Date.now() / 1000);
  const hasValidActiveRound = !!(activeRound && Number(activeRound.lockTimestamp) > 0);
  const isActiveLocked = hasValidActiveRound ? activeNow >= Number(activeRound!.lockTimestamp) : true;
  const isActiveResolved = activeRound?.resolved || activeRound?.canceled || false;
  const canBet = isConnected && activeRoundId > 0n && hasValidActiveRound && !isActiveLocked && !isActiveResolved && !hasPlacedActiveBet && !isPending && !isConfirming;

  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeRound!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  // Potential Return & Profit calculations
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

  // Previous round multipliers
  const prevUpMultiplier = prevMultipliers ? Number((prevMultipliers as any)[0] || 0n) / 10000 : 0;
  const prevDownMultiplier = prevMultipliers ? Number((prevMultipliers as any)[1] || 0n) / 10000 : 0;

  // Previous round pool distribution
  const prevTotalPool = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  const prevUpPercent = prevTotalPool > 0n ? Number((prevRound!.totalUpAmount * 10000n) / prevTotalPool) / 100 : 50;
  const prevDownPercent = prevTotalPool > 0n ? 100 - prevUpPercent : 50;

  const outcome = getPrevOutcome();

  if (!mounted) return null;

  const isWorking = isPending || isConfirming;
  const isMarketLocked = isConnected && !canBet && !isWorking;

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
          {/* Header — title + live BTC price + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>PLACE BET</span>
            <StatusBadge status={isMarketLocked ? 'locked' : 'ready'} label={isMarketLocked ? 'LOCKED' : 'READY'} />
          </div>

          {/* BTC Price + market label inline row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>BTC/USD</span>
            <PriceTicker price={currentBtcPrice} />
          </div>

          {/* Time Remaining / Lock Timer (Only if open) */}
          {!isMarketLocked && hasValidActiveRound && (
            <div style={{ marginBottom: 10 }}>
              <RoundTimer
                startTimestamp={Number(activeRound!.startTimestamp)}
                endTimestamp={Number(activeRound!.endTimestamp)}
                lockTimestamp={Number(activeRound!.lockTimestamp)}
                resolved={isActiveResolved}
                targetMode="lock"
              />
            </div>
          )}

          {/* Locked State Notification */}
          {isMarketLocked && (
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
                BETTING CLOSED · AWAITING NEXT ROUND
              </span>
            </div>
          )}

          {/* Wallet Balance */}
          {isConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                AVAILABLE
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
                      if (pct === 25) setBetAmount('0.05');
                      if (pct === 50) setBetAmount('0.10');
                      if (pct === 75) setBetAmount('0.25');
                      if (pct === 100) setBetAmount('0.50');
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

          {/* Live Multipliers + Potential Return/Profit (only when connected & amount entered) */}
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
              {/* Multiplier row */}
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
              {/* Return row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>RETURN</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    ▲ <AnimatedValue value={potentialUpReturn} decimals={4} />
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                    ▼ <AnimatedValue value={potentialDownReturn} decimals={4} />
                  </span>
                </div>
              </div>
              {/* Profit row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>PROFIT</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: potentialUpProfit >= 0 ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
                    ▲ {potentialUpProfit >= 0 ? '+' : ''}<AnimatedValue value={potentialUpProfit} decimals={4} />
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: potentialDownProfit >= 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)' }}>
                    ▼ {potentialDownProfit >= 0 ? '+' : ''}<AnimatedValue value={potentialDownProfit} decimals={4} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Multiplier hint (when no amount typed yet) */}
          {isConnected && stakeAmount === 0 && (activeUpMultiplier > 0 || activeDownMultiplier > 0) && !isMarketLocked && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>MULTIPLIER</span>
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

          {/* Pool distribution */}
          {isConnected && !isMarketLocked && activeTotalPool > 0n && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>POOL</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>▲ {activeUpPercent.toFixed(1)}%</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>▼ {activeDownPercent.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Triggers */}
        {isConnected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* UP vs DOWN buttons */}
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

            {/* Status updates */}
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
              status={isActiveLocked && !isActiveResolved ? 'live' : 'settled'}
              label={isActiveLocked && !isActiveResolved ? 'LIVE' : 'SETTLED'}
            />
          </div>

          {/* Time Remaining to settlement (If live locked) */}
          {isActiveLocked && !isActiveResolved && hasValidActiveRound && (
            <div style={{ marginBottom: 10 }}>
              <RoundTimer
                startTimestamp={Number(activeRound!.startTimestamp)}
                endTimestamp={Number(activeRound!.endTimestamp)}
                lockTimestamp={Number(activeRound!.lockTimestamp)}
                resolved={isActiveResolved}
                targetMode="end"
              />
            </div>
          )}

          {/* Round detail stats */}
          {isActiveLocked && !isActiveResolved && activeRound ? (
            // Live locked details
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Live price vs lock price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>LIVE PRICE</span>
                  <PriceTicker price={currentBtcPrice} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>LOCK PRICE</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                    ${(Number(activeRound.startPrice) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Live difference */}
              {activeRound.startPrice > 0n && (() => {
                const lockPx = Number(activeRound.startPrice) / 1e8;
                const diff = currentBtcPrice - lockPx;
                const diffPct = lockPx > 0 ? (diff / lockPx) * 100 : 0;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>DIFFERENCE</span>
                    <span style={{ color: diff >= 0 ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(3)}%)
                    </span>
                  </div>
                );
              })()}

              {/* Pool info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                <span style={{ color: 'var(--text-secondary)' }}>POOL SIZE</span>
                <span style={{ color: '#ffffff' }}>{activeTotalPool > 0n ? `${(Number(activeTotalPool) / 1e18).toFixed(4)} ETH` : '0.0000 ETH'}</span>
              </div>

              {/* Pool distribution */}
              {activeTotalPool > 0n && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>DISTRIBUTION</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#ffffff' }}>▲ {activeUpPercent.toFixed(1)}%</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {activeDownPercent.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Multipliers */}
              {(activeUpMultiplier > 0 || activeDownMultiplier > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>MULTIPLIERS</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#ffffff' }}>▲ <AnimatedValue value={activeUpMultiplier} decimals={2} suffix="×" /></span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ <AnimatedValue value={activeDownMultiplier} decimals={2} suffix="×" /></span>
                  </div>
                </div>
              )}
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
                    <span style={{ color: '#ffffff' }}>{(Number(prevRound.totalUpAmount + prevRound.totalDownAmount) / 1e18).toFixed(4)} ETH</span>
                  </div>

                  {/* Pool distribution for settled round */}
                  {prevTotalPool > 0n && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>DISTRIBUTION</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#ffffff' }}>▲ {prevUpPercent.toFixed(1)}%</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>▼ {prevDownPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Multipliers for settled round */}
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
        {!(isActiveLocked && !isActiveResolved) && hasPlacedPrevBet && prevUserBet && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>YOUR BET</span>
              <span style={{ color: '#ffffff' }}>
                {(Number(prevUserBet.amount) / 1e18).toFixed(4)} ETH · {prevUserBet.position === 0 ? 'UP' : 'DOWN'}
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
