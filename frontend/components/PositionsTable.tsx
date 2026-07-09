'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI, MARKET_ADDRESS } from '@/lib/abi';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Table, TableRow, TableCell } from './ui/Table';
import { Badge } from './ui/Badge';

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
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <Card hoverEffect={false} style={{ padding: '48px 24px', textAlign: 'center', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading positions...</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card hoverEffect={false} style={{ padding: '48px 24px', textAlign: 'center', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: '320px', lineHeight: 1.6 }}>Connect your wallet to view active positions and claim history.</p>
      </Card>
    );
  }

  return (
    <Card 
      hoverEffect={false} 
      style={{ 
        overflow: 'hidden',
        marginTop: 16,
        padding: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Table Header Section */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.005)',
          padding: '14px 20px'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
          Your Activity
        </span>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'positions' ? '#ffffff' : 'transparent',
              color: activeTab === 'positions' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            ACTIVE BETS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            HISTORY
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto', minHeight: '140px' }}>
        {recentIds.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-secondary)', fontSize: 13 }}>
            No active positions found
          </div>
        ) : (
          <Table headers={['ROUND ID', 'FORECAST', 'AMOUNT', 'LOCK PRICE', 'CLOSE PRICE', 'STATUS', 'ACTION']}>
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
          </Table>
        )}
      </div>

      {claimStatus && (
        <div style={{ padding: '10px 16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 11, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          {claimStatus}
        </div>
      )}
    </Card>
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

  const isUp = bet.position === 0; // 0 = UP, 1 = DOWN
  const upWins = round.closePrice > round.startPrice;
  const downWins = round.closePrice < round.startPrice;
  const isWinner = isResolved && !isCanceled && ((isUp && upWins) || (!isUp && downWins));

  // Scale prices
  const startPriceScaled = Number(round.startPrice) / 1e8;
  const closePriceScaled = Number(round.closePrice) / 1e8;

  let badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'outline' = 'default';
  let statusText = 'PENDING';

  if (isPendingRound) {
    statusText = 'ACTIVE';
    badgeVariant = 'success';
  } else if (isCanceled) {
    statusText = 'CANCELED';
    badgeVariant = 'outline';
  } else if (isWinner) {
    statusText = 'WON';
    badgeVariant = 'success';
  } else {
    statusText = 'LOST';
    badgeVariant = 'error';
  }

  return (
    <TableRow>
      <TableCell style={{ fontWeight: 600 }}>#{roundId.toString()}</TableCell>
      <TableCell>
        <span 
          style={{ 
            color: isUp ? '#ffffff' : 'var(--text-secondary)', 
            fontWeight: 700,
            background: isUp ? 'rgba(255,255,255,0.06)' : 'rgba(82,82,82,0.15)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 10,
            border: isUp ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(82,82,82,0.2)'
          }}
        >
          {isUp ? '▲ UP' : '▼ DOWN'}
        </span>
      </TableCell>
      <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{formatEther(bet.amount)} USDC</TableCell>
      <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
        {startPriceScaled > 0 ? `$${startPriceScaled.toFixed(2)}` : '—'}
      </TableCell>
      <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
        {closePriceScaled > 0 && !isPendingRound ? `$${closePriceScaled.toFixed(2)}` : '—'}
      </TableCell>
      <TableCell>
        <Badge variant={badgeVariant}>{statusText}</Badge>
      </TableCell>
      <TableCell style={{ textAlign: 'right' }}>
        {isClaimable && !bet.claimed ? (
          <Button
            onClick={() => onClaim(roundId)}
            disabled={claimPending}
            variant="primary"
            size="sm"
            style={{ padding: '4px 10px', borderRadius: '6px' }}
          >
            Claim Payout
          </Button>
        ) : bet.claimed ? (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Claimed</span>
        ) : isPendingRound ? (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Locked</span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
