'use client';

import React, { useState, useEffect } from 'react';
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

export function PositionsTable() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
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
  const recentIds = roundIds.slice(-10).reverse(); // Show last 10, newest first

  // Write contract for claiming
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setClaimStatus('⏳ Initiating claim...');
    else if (isConfirming) setClaimStatus('⛓️ Confirming on-chain...');
    else if (isSuccess) {
      setClaimStatus('✅ Claimed successfully!');
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

  if (!isConnected) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connect your wallet to view active positions and claim history.</p>
      </div>
    );
  }

  return (
    <div 
      className="glass-card" 
      style={{ 
        background: '#050505',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 12
      }}
    >
      {/* Table Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.01)',
          padding: '0 12px'
        }}
      >
        <button
          onClick={() => setActiveTab('positions')}
          style={{
            padding: '12px 16px',
            fontSize: 12,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'positions' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'positions' ? '2px solid #ffffff' : 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Positions (bets)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 16px',
            fontSize: 12,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid #ffffff' : 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Claimable History
        </button>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto', minHeight: '140px', maxHeight: '250px' }}>
        {recentIds.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-muted)', fontSize: 13 }}>
            No active bets found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.005)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>ROUND ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>FORECAST</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>AMOUNT</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>LOCK PRICE</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>CLOSE PRICE</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentIds.map((id) => (
                <PositionRow 
                  key={id.toString()} 
                  roundId={id} 
                  address={address!} 
                  activeTab={activeTab} 
                  onClaim={handleClaim} 
                  claimPending={isPending || isConfirming} 
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {claimStatus && (
        <div style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.03)', color: '#ffffff', fontSize: 11, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          {claimStatus}
        </div>
      )}
    </div>
  );
}

function PositionRow({
  roundId,
  address,
  activeTab,
  onClaim,
  claimPending,
}: {
  roundId: bigint;
  address: string;
  activeTab: 'positions' | 'history';
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

  const isResolved = round.resolved;
  const isCanceled = round.canceled;

  // Filter based on tab
  const isPendingRound = !isResolved && !isCanceled;
  const isClaimable = canClaim as boolean;

  if (activeTab === 'positions' && !isPendingRound) return null;
  if (activeTab === 'history' && isPendingRound) return null;

  const isUp = bet.position === 0; // 0 = UP, 1 = DOWN (matching contract positions)
  const upWins = round.closePrice > round.startPrice;
  const downWins = round.closePrice < round.startPrice;
  const isWinner = isResolved && !isCanceled && ((isUp && upWins) || (!isUp && downWins));

  // Scale prices
  const startPriceScaled = Number(round.startPrice) / 1e8;
  const closePriceScaled = Number(round.closePrice) / 1e8;

  let statusText = 'PENDING';
  let statusColor = 'var(--text-muted)';

  if (isPendingRound) {
    statusText = 'ACTIVE';
    statusColor = '#ffffff';
  } else if (isCanceled) {
    statusText = 'CANCELED';
    statusColor = '#525252';
  } else if (isWinner) {
    statusText = 'WON';
    statusColor = '#ffffff';
  } else {
    statusText = 'LOST';
    statusColor = '#525252';
  }

  return (
    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
      <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{roundId.toString()}</td>
      <td style={{ padding: '12px 16px' }}>
        <span 
          style={{ 
            color: isUp ? '#ffffff' : 'var(--text-muted)', 
            fontWeight: 700,
            background: isUp ? 'rgba(255,255,255,0.05)' : 'rgba(82,82,82,0.15)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10
          }}
        >
          {isUp ? '▲ UP' : '▼ DOWN'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{formatEther(bet.amount)} USDC</td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
        {startPriceScaled > 0 ? `$${startPriceScaled.toFixed(2)}` : '—'}
      </td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
        {closePriceScaled > 0 && !isPendingRound ? `$${closePriceScaled.toFixed(2)}` : '—'}
      </td>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: statusColor }}>{statusText}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        {isClaimable && !bet.claimed ? (
          <button
            onClick={() => onClaim(roundId)}
            disabled={claimPending}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Claim Payout
          </button>
        ) : bet.claimed ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Claimed</span>
        ) : isPendingRound ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Locked</span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
