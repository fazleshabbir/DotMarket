'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI, MARKET_ADDRESS } from '@/lib/abi';

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

interface BetData {
  position: number;
  amount: bigint;
  claimed: boolean;
}

interface ClaimableRound {
  roundId: bigint;
  bet: BetData;
  round: RoundData;
  isClaimable: boolean;
}

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  // Read user's round IDs
  const { data: userRoundIds } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserRounds',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const roundIds = (userRoundIds as bigint[] | undefined) || [];
  const recentIds = roundIds.slice(-6).reverse(); // Show last 6, newest first

  // Write contract for claiming
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setClaimStatus('⏳ Claiming...');
    else if (isConfirming) setClaimStatus('⛓️ Confirming...');
    else if (isSuccess) {
      setClaimStatus('✅ Claimed!');
      setTimeout(() => setClaimStatus(null), 3000);
    }
  }, [isPending, isConfirming, isSuccess]);

  const handleClaim = (roundId: bigint) => {
    writeContract({
      address: MARKET_ADDRESS,
      abi: ROUND_MARKET_ABI,
      functionName: 'claim',
      args: [roundId],
    });
  };

  if (!isConnected) return null;
  if (recentIds.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No bets placed yet</div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 16, overflow: 'auto', maxHeight: 280 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>
        Your Bets
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recentIds.map((id) => (
          <ClaimRow key={id.toString()} roundId={id} address={address!} onClaim={handleClaim} claimPending={isPending || isConfirming} />
        ))}
      </div>

      {claimStatus && (
        <div className="animate-slide-up" style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(15,23,42,0.6)', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          {claimStatus}
        </div>
      )}
    </div>
  );
}

function ClaimRow({
  roundId,
  address,
  onClaim,
  claimPending,
}: {
  roundId: bigint;
  address: string;
  onClaim: (id: bigint) => void;
  claimPending: boolean;
}) {
  const { data: roundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [roundId],
    query: { refetchInterval: 10000 },
  });

  const { data: betData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 10000 },
  });

  const { data: canClaim } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 10000 },
  });

  const round = roundData as unknown as RoundData | undefined;
  const bet = betData as unknown as BetData | undefined;

  if (!round || !bet || bet.amount === 0n) return null;

  const isUp = bet.position === 0;
  const isResolved = round.resolved;
  const upWins = round.closePrice > round.startPrice;
  const downWins = round.closePrice < round.startPrice;
  const isWinner = isResolved && !round.canceled && ((isUp && upWins) || (!isUp && downWins));
  const isCanceled = round.canceled;

  let resultLabel = 'PENDING';
  let resultColor = 'var(--accent)';
  if (bet.claimed) {
    resultLabel = 'CLAIMED';
    resultColor = 'var(--text-muted)';
  } else if (isCanceled) {
    resultLabel = 'REFUND';
    resultColor = '#ffc107';
  } else if (isResolved) {
    resultLabel = isWinner ? 'WON' : 'LOST';
    resultColor = isWinner ? 'var(--up)' : 'var(--down)';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', width: 35 }}>
          #{roundId.toString()}
        </span>
        <span style={{ fontSize: 13, color: isUp ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
          {isUp ? '▲' : '▼'}
        </span>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {formatEther(bet.amount)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: resultColor }}>{resultLabel}</span>
        {canClaim && !bet.claimed && (
          <button
            onClick={() => onClaim(roundId)}
            disabled={claimPending}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: claimPending ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
              color: '#000000',
              border: 'none',
              opacity: claimPending ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            Claim
          </button>
        )}
      </div>
    </div>
  );
}
