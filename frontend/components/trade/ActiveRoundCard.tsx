'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { RoundTimer } from '../RoundTimer';
import { ProgressBar } from './ProgressBar';
import { PoolStats } from './PoolStats';
import { PriceTicker } from './PriceTicker';

interface ActiveRoundCardProps {
  hasValidActiveRound: boolean;
  activeRoundId: bigint;
  activeRound: any;
  isActiveLocked: boolean;
  isActiveResolved: boolean;
  activeUpPercent: number;
  activeDownPercent: number;
  activeTotalPool: bigint;
  activeUpMultiplier: number;
  activeDownMultiplier: number;
  currentBtcPrice: number;
}

// Inline lock SVG for the locked state panel
const LockIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(255,255,255,0.5)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const ActiveRoundCard = memo(function ActiveRoundCard({
  hasValidActiveRound,
  activeRoundId,
  activeRound,
  isActiveLocked,
  isActiveResolved,
  activeUpPercent,
  activeDownPercent,
  activeTotalPool,
  activeUpMultiplier,
  activeDownMultiplier,
  currentBtcPrice,
}: ActiveRoundCardProps) {
  const formattedUp = activeRound ? (Number(activeRound.totalUpAmount) / 1e18).toFixed(2) : '0.00';
  const formattedDown = activeRound ? (Number(activeRound.totalDownAmount) / 1e18).toFixed(2) : '0.00';
  const formattedTotal = (Number(activeTotalPool) / 1e18).toFixed(2);
  const startPrice = activeRound ? Number(activeRound.startPrice) / 1e8 : 0;

  const badgeStatus = isActiveResolved ? 'settled' : isActiveLocked ? 'locked' : 'active';
  const badgeLabel = isActiveResolved ? 'SETTLED' : isActiveLocked ? 'LOCKED' : '● LIVE';

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.025)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.9)',
        borderRadius: 22,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'border-color 300ms ease',
      }}
    >
      {/* ── Section: Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#ffffff' }}>
          LIVE MARKET
        </div>
        <StatusBadge status={badgeStatus} label={badgeLabel} />
      </div>

      {/* ── Section: Locked State Panel ── */}
      {isActiveLocked && !isActiveResolved && (
        <div
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            marginBottom: 10,
            transition: 'all 300ms ease-out',
          }}
        >
          <LockIcon size={18} />

          <div style={{
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.12em',
            fontFamily: 'var(--font-mono)',
          }}>
            MARKET LOCKED
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)',
            textAlign: 'center', lineHeight: 1.4,
          }}>
            Betting is closed. Live price movement determines the outcome.
          </div>
        </div>
      )}

      {/* ── Section: Countdown ── */}
      {hasValidActiveRound && (
        <div style={{ marginBottom: 12 }}>
          <RoundTimer
            startTimestamp={Number(activeRound!.startTimestamp)}
            endTimestamp={Number(activeRound!.endTimestamp)}
            lockTimestamp={Number(activeRound!.lockTimestamp)}
            resolved={isActiveResolved}
            targetMode="lock"
          />
        </div>
      )}

      {!hasValidActiveRound && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            padding: '12px 0',
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.06)',
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          Awaiting active round creation...
        </div>
      )}

      {activeRound && (
        <>
          {/* ── Section: Prices ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: '8px 12px',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em' }}>CURRENT PRICE</span>
              <PriceTicker price={currentBtcPrice} />
            </div>

            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em' }}>LOCK PRICE</span>
              <strong style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {startPrice > 0 ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
              </strong>
            </div>
          </div>

          {/* ── Section: Distribution ── */}
          <ProgressBar upPercent={activeUpPercent} downPercent={activeDownPercent} />

          {/* ── Section: Pool Stats ── */}
          <PoolStats
            totalPool={formattedTotal}
            upAmount={formattedUp}
            downAmount={formattedDown}
            upMultiplier={activeUpMultiplier}
            downMultiplier={activeDownMultiplier}
          />

          {/* ── Section: Market State footer ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>MARKET STATUS</span>
            <span style={{ color: isActiveLocked ? 'rgba(255,255,255,0.5)' : '#ffffff', fontWeight: 700, letterSpacing: '0.08em' }}>
              {isActiveResolved ? 'SETTLED' : isActiveLocked ? 'LOCKED · LIVE MOVEMENT' : 'BETTING OPEN'}
            </span>
          </div>
        </>
      )}
    </Card>
  );
});

ActiveRoundCard.displayName = 'ActiveRoundCard';
