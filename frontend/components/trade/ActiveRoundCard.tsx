'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { RoundTimer } from '../RoundTimer';
import { ProgressBar } from './ProgressBar';
import { PoolStats } from './PoolStats';
import { BetActions } from './BetActions';

interface ActiveRoundCardProps {
  hasValidActiveRound: boolean;
  activeRoundId: bigint;
  activeRound: any;
  isActiveResolved: boolean;
  activeUpPercent: number;
  activeDownPercent: number;
  activeTotalPool: bigint;
  activeUpMultiplier: number;
  activeDownMultiplier: number;
  betAmount: string;
  setBetAmount: (val: string) => void;
  onPlaceBet: (position: number) => void;
  canBet: boolean;
  isPending: boolean;
  isConfirming: boolean;
  txStatus: string | null;
  isConnected: boolean;
  connectWalletCTA: React.ReactNode;
}

export const ActiveRoundCard = memo(function ActiveRoundCard({
  hasValidActiveRound,
  activeRoundId,
  activeRound,
  isActiveResolved,
  activeUpPercent,
  activeDownPercent,
  activeTotalPool,
  activeUpMultiplier,
  activeDownMultiplier,
  betAmount,
  setBetAmount,
  onPlaceBet,
  canBet,
  isPending,
  isConfirming,
  txStatus,
  isConnected,
  connectWalletCTA,
}: ActiveRoundCardProps) {
  const formattedUp = activeRound ? (Number(activeRound.totalUpAmount) / 1e18).toFixed(2) : '0.00';
  const formattedDown = activeRound ? (Number(activeRound.totalDownAmount) / 1e18).toFixed(2) : '0.00';
  const formattedTotal = (Number(activeTotalPool) / 1e18).toFixed(2);

  return (
    <Card hoverEffect={false} style={{ padding: '24px 20px' }}>
      {/* Header pair and status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.8px', color: '#ffffff' }}>
          BTC-USD FORECAST
        </div>
        <StatusBadge status="active" label={`Round #${activeRoundId.toString()}`} />
      </div>

      {/* Countdown Timer details */}
      {hasValidActiveRound ? (
        <RoundTimer
          startTimestamp={Number(activeRound!.startTimestamp)}
          endTimestamp={Number(activeRound!.endTimestamp)}
          lockTimestamp={Number(activeRound!.lockTimestamp)}
          resolved={isActiveResolved}
          targetMode="lock"
        />
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '12px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px' }}>
          Awaiting active round creation...
        </div>
      )}

      {activeRound && (
        <>
          {/* YES/NO progress slider */}
          <ProgressBar
            upPercent={activeUpPercent}
            downPercent={activeDownPercent}
          />

          {/* Sizing statistics */}
          <PoolStats
            totalPool={formattedTotal}
            upAmount={formattedUp}
            downAmount={formattedDown}
            upMultiplier={activeUpMultiplier}
            downMultiplier={activeDownMultiplier}
          />

          {/* Interactive forms/actions */}
          <BetActions
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            onPlaceBet={onPlaceBet}
            canBet={canBet}
            isPending={isPending}
            isConfirming={isConfirming}
            txStatus={txStatus}
            isConnected={isConnected}
            connectWalletCTA={connectWalletCTA}
          />
        </>
      )}
    </Card>
  );
});

ActiveRoundCard.displayName = 'ActiveRoundCard';
