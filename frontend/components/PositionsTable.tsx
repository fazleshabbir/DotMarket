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
  // Use the single authoritative clock from market context — no independent timer
  const { now } = useMarket();

  const timeLeft = Math.max(0, endTimestamp - now);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) return <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)' }}>0:00</span>;

  return (
    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
      {minutes}:{seconds.toString().padStart(2, '0')}
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

  const { data: userRoundIds } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserRounds',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const roundIds = (userRoundIds as bigint[] | undefined) || [];
  const recentIds = roundIds.slice(-15).reverse();

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
      <div style={{ padding: '24px', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>LOADING TERMINAL ACTIVITY...</p>
      </div>
    );
  }

  return (
    <div 
      className="premium-card"
      style={{ 
        overflow: 'hidden',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Exchange-style Tabs Header */}
      <div 
        style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 5, 5, 0.5)',
          padding: '0 16px',
          flexShrink: 0,
          gap: 24,
        }}
      >
        <button
          onClick={() => setActiveTab('positions')}
          style={{
            padding: '12px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'positions' ? 700 : 500,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'positions' ? '#ffffff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'positions' ? '2px solid #ffffff' : '2px solid transparent',
            transition: 'all 200ms ease',
            letterSpacing: '0.04em'
          }}
        >
          Open Positions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'history' ? 700 : 500,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'history' ? '2px solid #ffffff' : '2px solid transparent',
            transition: 'all 200ms ease',
            letterSpacing: '0.04em'
          }}
        >
          Trade History
        </button>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, background: 'rgba(0,0,0,0.4)' }}>
        {!isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 20 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#ffffff', fontWeight: 600 }}>Wallet Disconnected</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Connect your wallet to view active positions.</span>
            </div>
          </div>
        ) : recentIds.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 20 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#ffffff', fontWeight: 600 }}>No {activeTab === 'positions' ? 'Active Positions' : 'History'} Found</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Place a prediction to see it here.</span>
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
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 10, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
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

  // Use the single authoritative clock and price from market context — no independent timer
  const { now, btcPrice, balanceSymbol } = useMarket();

  const { data: roundData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [roundId],
    query: { refetchInterval: 3000 },
  });

  const { data: betData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 3000 },
  });

  const { data: canClaim } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [roundId, address as `0x${string}`],
    query: { refetchInterval: 3000 },
  });

  const { data: multipliersData } = useReadContract({
    address: marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [roundId],
    query: { refetchInterval: 3000 },
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
