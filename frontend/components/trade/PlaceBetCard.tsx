'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { BetActions } from './BetActions';

interface PlaceBetCardProps {
  betAmount: string;
  setBetAmount: (val: string) => void;
  onPlaceBet: (position: number) => void;
  canBet: boolean;
  isPending: boolean;
  isConfirming: boolean;
  txStatus: string | null;
  isConnected: boolean;
  connectWalletCTA: React.ReactNode;
  upMultiplier: number;
  downMultiplier: number;
}

export const PlaceBetCard = memo(function PlaceBetCard({
  betAmount,
  setBetAmount,
  onPlaceBet,
  canBet,
  isPending,
  isConfirming,
  txStatus,
  isConnected,
  connectWalletCTA,
  upMultiplier,
  downMultiplier,
}: PlaceBetCardProps) {
  // Always active unless paused/loading/etc
  const isMarketLocked = isConnected && !canBet && !isPending && !isConfirming;

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.025)',
        borderRadius: 22,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 300ms ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#ffffff' }}>
          PLACE BET
        </div>
        <StatusBadge status={isMarketLocked ? 'locked' : 'ready'} label={isMarketLocked ? 'LOCKED' : 'READY'} />
      </div>

      {/* ── Betting actions/forms ── */}
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
        upMultiplier={upMultiplier}
        downMultiplier={downMultiplier}
      />
    </Card>
  );
});

PlaceBetCard.displayName = 'PlaceBetCard';
