'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useCurrentChain, useContracts, useExplorer } from '../hooks/useNetworkConfig';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Table, TableRow, TableCell } from './ui/Table';
import { Badge } from './ui/Badge';
import { useMarket } from '@/lib/marketStore';

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

// ── Live countdown helper for individual bet row ────────────────────────────
function BetCountdown({ endTimestamp }: { endTimestamp: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = Math.max(0, endTimestamp - now);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) return <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)' }}>0:00</span>;

  return (
    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
      {minutes}:${seconds.toString().padStart(2, '0')}
    </span>
  );
}

export function PositionsTable() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

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
      <Card hoverEffect={false} style={{ padding: '24px 20px', textAlign: 'center', minHeight: '220px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>LOADING TERMINAL ACTIVITY...</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card
        hoverEffect={false}
        style={{
          minHeight: '220px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
          gap: 12,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: 13, color: '#ffffff', marginBottom: 4, letterSpacing: '0.5px' }}>
            No Active Bets
          </strong>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.4 }}>
            Connect your wallet to place your first prediction.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      hoverEffect={false} 
      style={{ 
        overflow: 'hidden',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '220px',
        height: '100%',
        boxSizing: 'border-box'
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
          padding: '10px 16px',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff' }}>
          YOUR ACTIVITY
        </span>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '12px',
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
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '12px',
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
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {recentIds.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 20 }}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#ffffff', fontWeight: 600 }}>No Active Bets</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Connect your wallet to place your first prediction.</span>
            </div>
          </div>
        ) : (
          <Table headers={['ROUND ID / TIME', 'FORECAST / MULT', 'AMOUNT / RETURN', 'ENTRY PRICE', 'CURRENT / CLOSE', 'STATUS', 'ACTION']}>
            {recentIds.map((id) => (
              <PositionRow 
                key={id.toString()} 
                roundId={id} 
                address={address!} 
                activeTab={activeTab} 
                onClaim={handleClaim} 
                claimPending={isPending || isConfirming} 
                marketAddress={MARKET_ADDRESS}
              />
            ))}
          </Table>
        )}
      </div>

      {claimStatus && (
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 10, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
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
  marketAddress,
}: {
  roundId: bigint;
  address: string;
  activeTab: 'positions' | 'history';
  onClaim: (id: bigint) => void;
  claimPending: boolean;
  marketAddress: `0x${string}`;
}) {
  const currentChain = useCurrentChain();
  const explorer = useExplorer();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live elements from central market context
  const { btcPrice, balanceSymbol } = useMarket();

  const { data: roundData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [roundId],
    query: { refetchInterval: 10000 },
  });

  const { data: betData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 10000 },
  });

  const { data: canClaim } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 10000 },
  });

  const { data: multipliersData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [roundId],
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

  // Multiplier calculations
  const upMultiplier = multipliersData ? Number((multipliersData as any)[0] || 0n) / 10000 : 1.9;
  const downMultiplier = multipliersData ? Number((multipliersData as any)[1] || 0n) / 10000 : 1.9;
  const lockedMultiplier = isUp ? upMultiplier : downMultiplier;

  // Return & profit calculations
  const parsedAmount = parseFloat(formatEther(bet.amount));
  const potentialReturn = parsedAmount * lockedMultiplier;
  const potentialProfit = potentialReturn - parsedAmount;

  // Derive live status
  let badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'outline' = 'default';
  let statusText = 'PENDING';

  if (isPendingRound) {
    const endTs = Number(round.endTimestamp);
    const isSettling = endTs > 0 && now >= endTs;

    if (isSettling) {
      statusText = 'SETTLING';
      badgeVariant = 'warning';
    } else if (btcPrice > 0 && startPriceScaled > 0) {
      const priceAbove = btcPrice > startPriceScaled;
      const winning = isUp ? priceAbove : !priceAbove;
      statusText = winning ? 'WINNING' : 'LOSING';
      badgeVariant = winning ? 'success' : 'error';
    } else {
      statusText = 'ACTIVE';
      badgeVariant = 'success';
    }
  } else if (isCanceled) {
    statusText = 'REFUNDED';
    badgeVariant = 'outline';
  } else if (isWinner) {
    statusText = 'WON';
    badgeVariant = 'success';
  } else {
    statusText = 'LOST';
    badgeVariant = 'error';
  }
  
  const explorerUrl = explorer.getAddressUrl(marketAddress);

  return (
    <TableRow>
      {/* ROUND ID / TIME */}
      <TableCell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }} title="View Contract on Explorer">
              #{roundId.toString()} ↗
            </a>
          ) : (
            <span style={{ fontWeight: 600 }}>#{roundId.toString()}</span>
          )}
          {isPendingRound && Number(round.endTimestamp) > 0 && (
            <BetCountdown endTimestamp={Number(round.endTimestamp)} />
          )}
        </div>
      </TableCell>

      {/* FORECAST / MULT */}
      <TableCell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
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
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
            {lockedMultiplier.toFixed(2)}×
          </span>
        </div>
      </TableCell>

      {/* AMOUNT / RETURN */}
      <TableCell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 }}>
            {parsedAmount.toFixed(4)} {balanceSymbol}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Ret: {potentialReturn.toFixed(4)} (+{potentialProfit.toFixed(4)})
          </span>
        </div>
      </TableCell>

      {/* ENTRY PRICE */}
      <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
        {startPriceScaled > 0 ? `$${startPriceScaled.toFixed(2)}` : '—'}
      </TableCell>

      {/* CURRENT / CLOSE */}
      <TableCell>
        {isPendingRound ? (
          btcPrice > 0 && startPriceScaled > 0 ? (
            (() => {
              const diff = btcPrice - startPriceScaled;
              const diffSign = diff >= 0 ? '+' : '';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ffffff' }}>
                    ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff >= 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)' }}>
                    {diffSign}{diff.toFixed(2)}
                  </span>
                </div>
              );
            })()
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>—</span>
          )
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {closePriceScaled > 0 ? `$${closePriceScaled.toFixed(2)}` : '—'}
          </span>
        )}
      </TableCell>

      {/* STATUS */}
      <TableCell>
        <Badge variant={badgeVariant}>{statusText}</Badge>
      </TableCell>

      {/* ACTION */}
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
