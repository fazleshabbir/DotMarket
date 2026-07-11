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
      <Card
        hoverEffect={false}
        style={{
          padding: '16px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
          borderRadius: 22,
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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

  const badgeStatus = isCanceled ? 'canceled' : isResolved ? 'settled' : 'settling';
  const badgeLabel = isCanceled ? 'CANCELED' : isResolved ? '✓ SETTLED' : 'SETTLING';

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
        opacity: 0.85,
        transition: 'border-color 300ms ease, opacity 300ms ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#ffffff' }}>
          PREVIOUS MARKET
        </div>
        <StatusBadge status={badgeStatus} label={badgeLabel} />
      </div>

      {/* ── Winning Side banner ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: '7px 12px',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>WINNING SIDE</span>
        <strong style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          {outcome.text}
        </strong>
      </div>

      {/* ── Data rows ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'ENTRY PRICE', value: `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'SETTLEMENT PRICE', value: isResolved ? `$${closePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—' },
          { label: 'POOL SIZE', value: `${totalPool} ETH` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── User Bet section ── */}
      {hasPlacedPrevBet && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>YOUR BET</span>
            <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {userBetAmount} ETH · {prevUserBet.position === 0 ? 'UP' : 'DOWN'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>RESULT</span>
            <strong style={{ fontSize: 10, color: outcome.userColor || '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              {outcome.userText || 'LOST'}
            </strong>
          </div>

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
                borderRadius: 10,
                height: 32,
                marginTop: 4,
                letterSpacing: '0.06em',
              }}
            >
              CLAIM WINNINGS
            </Button>
          )}

          {userClaimed && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
              }}
            >
              ✓ PAYOUT CLAIMED
            </div>
          )}

          {claimStatus && (
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
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
