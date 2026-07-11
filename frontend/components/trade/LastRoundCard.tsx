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
      <Card hoverEffect={false} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No previous rounds found.
      </Card>
    );
  }

  const startPrice = Number(prevRound.startPrice) / 1e8;
  const closePrice = Number(prevRound.closePrice) / 1e8;
  const isCanceled = prevRound.canceled;
  const isResolved = prevRound.resolved;
  const isLocked = !isResolved && !isCanceled;

  const totalPool = (Number(prevRound.totalUpAmount + prevRound.totalDownAmount) / 1e18).toFixed(2);
  const upPool = (Number(prevRound.totalUpAmount) / 1e18).toFixed(2);
  const downPool = (Number(prevRound.totalDownAmount) / 1e18).toFixed(2);

  const userBetAmount = prevUserBet ? (Number(prevUserBet.amount) / 1e18).toFixed(2) : '0.00';
  const userClaimed = prevUserBet?.claimed || false;
  const canClaim = isClaimable && !userClaimed && !isClaimingPending && !isClaimingConfirming;

  return (
    <Card hoverEffect={false} style={{ padding: '24px 20px', position: 'relative' }}>
      {/* Title Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.8px', color: '#ffffff' }}>
          LAST ROUND RESULTS
        </div>
        <StatusBadge
          status={isResolved ? 'resolved' : isCanceled ? 'canceled' : 'locked'}
          label={`Round #${prevRoundId.toString()}`}
        />
      </div>

      {/* Outcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>OUTCOME</span>
        <strong style={{ fontSize: 13, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
          {outcome.text}
        </strong>
      </div>

      {/* Details list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>LOCKED PRICE</span>
          <span style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            ${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CLOSE PRICE</span>
          <span style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {isLocked ? 'calculating...' : `$${closePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>TOTAL POOL</span>
          <span style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {totalPool} USDC
          </span>
        </div>
      </div>

      {/* User Bet & Claim state section */}
      {hasPlacedPrevBet && (
        <div
          style={{
            borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>YOUR BET</span>
            <span style={{ fontSize: 12, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {userBetAmount} ETH ({prevUserBet.position === 0 ? 'UP' : 'DOWN'})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>WINNING STATUS</span>
            <strong style={{ fontSize: 11, color: outcome.userColor || '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {outcome.userText || 'LOST'}
            </strong>
          </div>

          {/* Claim Action Button */}
          {canClaim && (
            <Button
              variant="primary"
              size="md"
              onClick={onClaim}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#000000',
                fontWeight: 700,
                borderRadius: '12px',
                marginTop: 8,
              }}
            >
              Claim Payout
            </Button>
          )}

          {userClaimed && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.05)',
                borderRadius: '8px',
                width: '100%',
                marginTop: 4,
              }}
            >
              ✓ Payout Claimed
            </div>
          )}

          {claimStatus && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                marginTop: 4,
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
