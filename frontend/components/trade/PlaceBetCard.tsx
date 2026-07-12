'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { BetActions } from './BetActions';
import { LockIcon } from '../ui/LockIcon';

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
  // Determine if market is locked (not able to bet even while connected)
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

      {/* ── Locked for Settlement state ── */}
      {isMarketLocked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 12,
            transition: 'all 300ms ease-out',
          }}
        >
          <LockIcon size={14} style={{ opacity: 0.4 }} />
          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
          }}>
            LOCKED FOR SETTLEMENT
          </span>
        </div>
      )}

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
      />
    </Card>
  );
});

PlaceBetCard.displayName = 'PlaceBetCard';
