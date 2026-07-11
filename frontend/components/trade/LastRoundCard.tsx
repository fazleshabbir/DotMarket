'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from './StatusBadge';

interface LastRoundCardProps {
  prevRoundId: bigint;
  prevRound: any;
  outcome: { text: string; color: string; userText?: string; userColor?: string };
  hasPlacedPrevBet: boolean;
  prevUserBet: any;
  isClaimable: boolean | undefined;
  onClaim: () => void;
  isClaimingPending: boolean;
  isClaimingConfirming: boolean;
  claimStatus: string | null;
}

export const LastRoundCard = memo(function LastRoundCard({
  prevRoundId,
  prevRound,
  outcome,
  hasPlacedPrevBet,
  prevUserBet,
  isClaimable,
  onClaim,
  isClaimingPending,
  isClaimingConfirming,
  claimStatus,
}: LastRoundCardProps) {
  if (!prevRound || prevRoundId === 0n) {
    return (
      <Card hoverEffect={false} style={{ padding: '12px 16px', textAlign: 'center', height: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No previous market data.</span>
      </Card>
    );
  }

  const startPrice = Number(prevRound.startPrice) / 1e8;
  const closePrice = Number(prevRound.closePrice) / 1e8;
  const isCanceled = prevRound.canceled;
  const isResolved = prevRound.resolved;

  const totalPool = (Number(prevRound.totalUpAmount + prevRound.totalDownAmount) / 1e18).toFixed(2);
  const userBetAmount = prevUserBet ? (Number(prevUserBet.amount) / 1e18).toFixed(2) : '0.00';
  const userClaimed = prevUserBet?.claimed || false;
  const canClaim = isClaimable && !userClaimed && !isClaimingPending && !isClaimingConfirming;

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '10px 16px',
        opacity: 0.8,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Header with SETTLED status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff' }}>
          PREVIOUS MARKET
        </div>
        <StatusBadge status="resolved" label="✓ SETTLED" />
      </div>

      {/* Outcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '4px 8px',
          borderRadius: '8px',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>WINNING SIDE</span>
        <strong style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
          {outcome.text}
        </strong>
      </div>

      {/* Details list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ENTRY PRICE</span>
          <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            ${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>SETTLEMENT PRICE</span>
          <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {isResolved ? `$${closePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'calculating...'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>POOL SIZE</span>
          <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {totalPool} USDC
          </span>
        </div>
      </div>

      {/* User Bet outcome and Claim state */}
      {hasPlacedPrevBet && (
        <div
          style={{
            borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
            paddingTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>YOUR BET</span>
            <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {userBetAmount} ETH ({prevUserBet.position === 0 ? 'UP' : 'DOWN'})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ROUND RESULT</span>
            <strong style={{ fontSize: 10, color: outcome.userColor || '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {outcome.userText || 'LOST'}
            </strong>
          </div>

          {/* Claim rewards action button */}
          {canClaim && (
            <Button
              variant="primary"
              size="sm"
              onClick={onClaim}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#000000',
                fontWeight: 700,
                borderRadius: '8px',
                height: '28px',
                marginTop: 2,
              }}
            >
              Claim Winnings
            </Button>
          )}

          {userClaimed && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.05)',
                borderRadius: '6px',
                width: '100%',
                marginTop: 2,
              }}
            >
              ✓ Payout Claimed
            </div>
          )}

          {claimStatus && (
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px',
                marginTop: 2,
              }}
            >
              {claimStatus}
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

LastRoundCard.displayName = 'LastRoundCard';
