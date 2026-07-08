'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ROUND_MARKET_ABI, MARKET_ADDRESS } from '@/lib/abi';
import { RoundTimer } from './RoundTimer';

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

export function BettingPanel({ currentBtcPrice }: BettingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const hasPlacedActiveBet = activeUserBet && activeUserBet.amount > 0n;

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
  const hasPlacedPrevBet = prevUserBet && prevUserBet.amount > 0n;

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
    if (isPending) setTxStatus('⏳ Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('⛓️ Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('✅ Operation successful!');
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  // Place bet action
  const handlePlaceBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [activeRoundId, position],
        value: parseEther(betAmount),
      });
    } catch (err) {
      setTxStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Claim action
  const handleClaim = () => {
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'claim',
        args: [prevRoundId],
      });
    } catch (err) {
      setTxStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Calculations for Active Round
  const activeNow = Math.floor(Date.now() / 1000);
  const isActiveLocked = activeRound ? activeNow >= Number(activeRound.lockTimestamp) : false;
  const isActiveResolved = activeRound?.resolved || activeRound?.canceled || false;
  const canBet = isConnected && activeRoundId > 0n && !isActiveLocked && !isActiveResolved && !hasPlacedActiveBet && !isPending && !isConfirming;

  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeRound!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  // Calculations for Previous Round
  const prevTotalPool = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  const prevUpPercent = prevTotalPool > 0n ? Number((prevRound!.totalUpAmount * 10000n) / prevTotalPool) / 100 : 50;
  const prevDownPercent = prevTotalPool > 0n ? 100 - prevUpPercent : 50;

  const prevUpMultiplier = prevMultipliers ? Number((prevMultipliers as any)[0] || 0n) / 10000 : 0;
  const prevDownMultiplier = prevMultipliers ? Number((prevMultipliers as any)[1] || 0n) / 10000 : 0;

  // Determine previous round outcome
  const getPrevOutcome = (): { text: string; color: string; userText?: string; userColor?: string } => {
    if (!prevRound) return { text: '—', color: 'var(--text-muted)' };
    if (!prevRound.resolved && !prevRound.canceled) {
      return { text: 'LIVE MOVEMENT', color: '#ff9800' };
    }
    if (prevRound.canceled) {
      return { text: 'CANCELED', color: 'var(--text-muted)', userText: 'REFUNDED', userColor: '#ffffff' };
    }

    const upWins = prevRound.closePrice > prevRound.startPrice;
    const downWins = prevRound.closePrice < prevRound.startPrice;
    const outcomeText = upWins ? '▲ UP WINS' : downWins ? '▼ DOWN WINS' : 'DRAW';
    const outcomeColor = upWins ? 'var(--up)' : downWins ? 'var(--down)' : 'var(--text-muted)';

    let userText: string | undefined;
    let userColor: string | undefined;

    if (hasPlacedPrevBet && prevUserBet) {
      const userPosition = prevUserBet.position;
      const won = (upWins && userPosition === 0) || (downWins && userPosition === 1);
      const tie = !upWins && !downWins;

      if (tie) {
        userText = 'DRAW';
        userColor = 'var(--text-secondary)';
      } else if (won) {
        userText = 'WINNER';
        userColor = 'var(--up)';
      } else {
        userText = 'LOST';
        userColor = 'var(--down)';
      }
    }

    return { text: outcomeText, color: outcomeColor, userText, userColor };
  };

  const outcome = getPrevOutcome();

  if (!mounted) {
    return (
      <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Panel...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      {/* ─── CURRENT BETTING ROUND ────────────────────────────────────────── */}
      <div className="glass-card animate-slide-up" style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--up)' }}>
            🟢 BTC PAIR
          </div>
          <span
            className="font-mono"
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          >
            Active Round
          </span>
        </div>

        {/* Timer */}
        {activeRound && activeRoundId > 0n ? (
          <RoundTimer
            startTimestamp={Number(activeRound.startTimestamp)}
            endTimestamp={Number(activeRound.endTimestamp)}
            lockTimestamp={Number(activeRound.lockTimestamp)}
            resolved={isActiveResolved}
            targetMode="lock"
          />
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>
            Awaiting active round creation...
          </div>
        )}

        {/* Pool Visualization */}
        {activeRound && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--up)', fontWeight: 600 }}>
                UP {activeUpPercent.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--down)', fontWeight: 600 }}>
                {activeDownPercent.toFixed(1)}% DOWN
              </span>
            </div>
            <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(15,23,42,0.6)' }}>
              <div className="pool-bar" style={{ width: `${activeUpPercent}%`, background: 'var(--up)' }} />
              <div className="pool-bar" style={{ width: `${activeDownPercent}%`, background: 'var(--down)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {activeTotalPool > 0n ? formatEther(activeRound.totalUpAmount) : '0'} USDC
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {activeTotalPool > 0n ? formatEther(activeRound.totalDownAmount) : '0'} USDC
              </span>
            </div>
          </div>
        )}

        {/* Multipliers */}
        {activeRound && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'var(--up-dim)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>UP Payout</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--up)' }}>
                {activeUpMultiplier > 0 ? `${activeUpMultiplier.toFixed(2)}x` : '—'}
              </div>
            </div>
            <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'var(--down-dim)', border: '1px solid rgba(82, 82, 82, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>DOWN Payout</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--down)' }}>
                {activeDownMultiplier > 0 ? `${activeDownMultiplier.toFixed(2)}x` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Live BTC Price */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 16,
            fontSize: 11
          }}
        >
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live BTC Price</span>
          <strong className="font-mono" style={{ color: '#ffffff', fontSize: 12 }}>
            ${currentBtcPrice.toFixed(2)}
          </strong>
        </div>

        {/* User's active bet */}
        {hasPlacedActiveBet && activeUserBet && (
          <div className="animate-slide-up" style={{ padding: 10, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(163, 163, 163, 0.1)', marginBottom: 12, textAlign: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--accent)' }}>
              Bet placed: <strong className="font-mono">{formatEther(activeUserBet.amount)} USDC</strong> on{' '}
              <strong style={{ color: activeUserBet.position === 0 ? 'var(--up)' : 'var(--down)' }}>
                {activeUserBet.position === 0 ? '▲ UP' : '▼ DOWN'}
              </strong>
            </span>
          </div>
        )}

        {/* Bet Input */}
        {!hasPlacedActiveBet && activeRound && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="input-amount"
                placeholder="0.0"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={!canBet}
                min="0.1"
                step="0.1"
                style={{ height: 38, fontSize: 13, padding: '0 50px 0 12px' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                USDC
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {['0.1', '0.5', '1', '5'].map((v) => (
                <button
                  key={v}
                  onClick={() => setBetAmount(v)}
                  disabled={!canBet}
                  style={{
                    flex: 1,
                    padding: '4px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    cursor: canBet ? 'pointer' : 'not-allowed',
                    background: 'rgba(15,23,42,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    opacity: canBet ? 1 : 0.4,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* UP / DOWN Buttons */}
        {!hasPlacedActiveBet && activeRound && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-up"
              style={{ flex: '1 1 0', minWidth: 0, fontSize: 13, height: 40, borderRadius: 8, fontWeight: 700 }}
              onClick={() => handlePlaceBet(0)}
              disabled={!canBet || !betAmount}
            >
              ▲ UP
            </button>
            <button
              className="btn-down"
              style={{ flex: '1 1 0', minWidth: 0, fontSize: 13, height: 40, borderRadius: 8, fontWeight: 700 }}
              onClick={() => handlePlaceBet(1)}
              disabled={!canBet || !betAmount}
            >
              ▼ DOWN
            </button>
          </div>
        )}

        {/* Not Connected / Messages */}
        {!isConnected && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Connect wallet to bet
          </div>
        )}
      </div>

      {/* ─── PREVIOUS LOCKED ROUND ────────────────────────────────────────── */}
      {prevRoundId > 0n && prevRound && (
        <div className="glass-card animate-slide-up" style={{ padding: 20, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
              🔒 Last Round
            </div>
            <span
              className="font-mono"
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              Last Round
            </span>
          </div>

          {/* Timer */}
          <RoundTimer
            startTimestamp={Number(prevRound.startTimestamp)}
            endTimestamp={Number(prevRound.endTimestamp)}
            lockTimestamp={Number(prevRound.lockTimestamp)}
            resolved={prevRound.resolved || prevRound.canceled}
            targetMode="end"
          />

          {/* Price Metrics */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.04)', 
              borderRadius: 8, 
              padding: '8px 12px', 
              marginTop: 16,
              marginBottom: 16,
              fontSize: 11
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Locked Price</span>
              <strong className="font-mono" style={{ color: '#ffffff', fontSize: 12 }}>
                ${(Number(prevRound.startPrice) / 1e8).toFixed(2)}
              </strong>
            </div>
            <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>
                {prevRound.resolved ? 'Close Price' : 'Live Price'}
              </span>
              <strong className="font-mono" style={{ color: prevRound.resolved ? 'var(--text-secondary)' : '#ffffff', fontSize: 12 }}>
                ${prevRound.resolved 
                  ? (Number(prevRound.closePrice) / 1e8).toFixed(2)
                  : currentBtcPrice.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* User's past bet */}
          {hasPlacedPrevBet && prevUserBet && (
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: 12, textAlign: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                You bet <strong className="font-mono">{formatEther(prevUserBet.amount)} USDC</strong> on{' '}
                <strong style={{ color: prevUserBet.position === 0 ? 'var(--up)' : 'var(--down)' }}>
                  {prevUserBet.position === 0 ? '▲ UP' : '▼ DOWN'}
                </strong>
              </span>
            </div>
          )}

          {/* Settle Status / Winnings Claims */}
          <div style={{ marginTop: 12 }}>
            {prevRound.resolved || prevRound.canceled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Result display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Outcome:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: outcome.color }}>
                    {outcome.text}
                  </span>
                </div>

                {hasPlacedPrevBet && outcome.userText && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your Position:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: outcome.userColor }}>
                      {outcome.userText}
                    </span>
                  </div>
                )}

                {/* Claim Reward Button */}
                {isClaimable && !prevUserBet?.claimed && (
                  <button
                    onClick={handleClaim}
                    disabled={isPending || isConfirming}
                    style={{
                      width: '100%',
                      height: 36,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, var(--up), #22c55e)',
                      border: 'none',
                      color: '#020617',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    CLAIM REWARDS
                  </button>
                )}

                {prevUserBet?.claimed && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--up)', fontWeight: 600, padding: '4px 0' }}>
                    ✓ REWARDS CLAIMED SUCCESSFULLY
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', border: '1px dashed rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: 6 }}>
                🕒 Waiting for close price...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operation Status Messages */}
      {txStatus && (
        <div className="glass-card animate-slide-up" style={{ padding: 10, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {txStatus}
        </div>
      )}
    </div>
  );
}
