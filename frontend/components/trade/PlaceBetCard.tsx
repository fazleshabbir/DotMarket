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
}: PlaceBetCardProps) {
  return (
    <Card hoverEffect={false} style={{ padding: '24px 20px' }}>
      {/* Header with READY status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff' }}>
          PLACE BET
        </div>
        <StatusBadge status="ready" label="READY" />
      </div>

      {/* Betting actions/forms */}
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
    </Card>
  );
});

PlaceBetCard.displayName = 'PlaceBetCard';
