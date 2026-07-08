'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export function BettingPanel() {
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Read current round ID
  const { data: currentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 5000 },
  });

  const roundId = currentRoundId ? BigInt(currentRoundId.toString()) : 0n;

  // Read round data
  const { data: roundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [roundId],
    query: { enabled: roundId > 0n, refetchInterval: 5000 },
  });

  const round = roundData as unknown as RoundData | undefined;

  // Read multipliers
  const { data: multipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [roundId],
    query: { enabled: roundId > 0n, refetchInterval: 5000 },
  });

  // Read user's bet for this round
  const { data: userBetData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [roundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: roundId > 0n && !!address, refetchInterval: 5000 },
  });

  const userBet = userBetData as unknown as { position: number; amount: bigint; claimed: boolean } | undefined;
  const hasPlacedBet = userBet && userBet.amount > 0n;

  // Write contract for placing bets
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setTxStatus('⏳ Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('⛓️ Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('✅ Bet placed successfully!');
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  // Derived state
  const now = Math.floor(Date.now() / 1000);
  const isLocked = round ? now >= Number(round.lockTimestamp) : false;
  const isResolved = round?.resolved || round?.canceled || false;
  const canBet = isConnected && roundId > 0n && !isLocked && !isResolved && !hasPlacedBet && !isPending && !isConfirming;

  const totalPool = round ? round.totalUpAmount + round.totalDownAmount : 0n;
  const upPercent = totalPool > 0n ? Number((round!.totalUpAmount * 10000n) / totalPool) / 100 : 50;
  const downPercent = totalPool > 0n ? 100 - upPercent : 50;

  const upMultiplier = multipliers ? Number((multipliers as any)[0] || 0n) / 10000 : 0;
  const downMultiplier = multipliers ? Number((multipliers as any)[1] || 0n) / 10000 : 0;

  const placeBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [roundId, position],
        value: parseEther(betAmount),
      });
    } catch (err) {
      setTxStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Determine round state
  const getState = (): 'waiting' | 'open' | 'locked' | 'resolving' | 'resolved' => {
    if (roundId === 0n) return 'waiting';
    if (isResolved) return 'resolved';
    if (!round) return 'waiting';
    if (now >= Number(round.endTimestamp)) return 'resolving';
    if (now >= Number(round.lockTimestamp)) return 'locked';
    return 'open';
  };
  const state = getState();

  return (
    <div className="glass-card animate-slide-up" style={{ padding: 20, flex: 1 }}>
      {/* Round Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffffff' }}>
            BTC Pair
          </div>
        </div>
        <span
          className={`badge-${state}`}
          style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {state === 'waiting' ? 'No Round' : state}
        </span>
      </div>

      {/* Timer */}
      {round && roundId > 0n && (
        <RoundTimer
          startTimestamp={Number(round.startTimestamp)}
          endTimestamp={Number(round.endTimestamp)}
          lockTimestamp={Number(round.lockTimestamp)}
          resolved={isResolved}
        />
      )}

      {/* Pool Visualization */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--up)', fontWeight: 600 }}>
            UP {upPercent.toFixed(1)}%
          </span>
          <span style={{ fontSize: 12, color: 'var(--down)', fontWeight: 600 }}>
            {downPercent.toFixed(1)}% DOWN
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(15,23,42,0.6)' }}>
          <div className="pool-bar" style={{ width: `${upPercent}%`, background: 'var(--up)' }} />
          <div className="pool-bar" style={{ width: `${downPercent}%`, background: 'var(--down)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {totalPool > 0n ? formatEther(round!.totalUpAmount) : '0'} USDC
          </span>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {totalPool > 0n ? formatEther(round!.totalDownAmount) : '0'} USDC
          </span>
        </div>
      </div>

      {/* Multipliers */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--up-dim)', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>UP Payout</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--up)' }}>
            {upMultiplier > 0 ? `${upMultiplier.toFixed(2)}x` : '—'}
          </div>
        </div>
        <div style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--down-dim)', border: '1px solid rgba(82, 82, 82, 0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DOWN Payout</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--down)' }}>
            {downMultiplier > 0 ? `${downMultiplier.toFixed(2)}x` : '—'}
          </div>
        </div>
      </div>

      {/* User's current bet */}
      {hasPlacedBet && (
        <div className="animate-slide-up" style={{ padding: 12, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(163, 163, 163, 0.2)', marginBottom: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--accent)' }}>
            You bet <strong className="font-mono">{formatEther(userBet!.amount)} USDC</strong> on{' '}
            <strong style={{ color: userBet!.position === 0 ? 'var(--up)' : 'var(--down)' }}>
              {userBet!.position === 0 ? '⚪ UP' : '⚫ DOWN'}
            </strong>
          </span>
        </div>
      )}

      {/* Bet Input */}
      {!hasPlacedBet && (
        <div style={{ marginBottom: 16 }}>
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
            />
            <span
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              USDC
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {['0.1', '0.5', '1', '5'].map((v) => (
              <button
                key={v}
                onClick={() => setBetAmount(v)}
                disabled={!canBet}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  cursor: canBet ? 'pointer' : 'not-allowed',
                  background: 'rgba(15,23,42,0.6)',
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
      {!hasPlacedBet && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-up"
            style={{ flex: 1, fontSize: 15 }}
            onClick={() => placeBet(0)}
            disabled={!canBet || !betAmount}
          >
            ▲ UP
          </button>
          <button
            className="btn-down"
            style={{ flex: 1, fontSize: 15 }}
            onClick={() => placeBet(1)}
            disabled={!canBet || !betAmount}
          >
            ▼ DOWN
          </button>
        </div>
      )}

      {/* Status Message */}
      {txStatus && (
        <div className="animate-slide-up" style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(15,23,42,0.6)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          {txStatus}
        </div>
      )}

      {/* Not Connected */}
      {!isConnected && (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Connect your wallet to place bets
        </div>
      )}
    </div>
  );
}
