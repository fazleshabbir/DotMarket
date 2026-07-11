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

  // Determine market sub-status
  const getMarketStatusText = () => {
    if (isActiveResolved) return 'RESOLVED';
    if (isActiveLocked) return 'LOCKED (LIVE MOVEMENT)';
    return 'BETTING OPEN';
  };

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.12)', 
        background: 'rgba(255, 255, 255, 0.03)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Header with ACTIVE badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#ffffff',
          }}
        >
          LIVE MARKET
        </div>
        <StatusBadge status="active" label="● ACTIVE" />
      </div>

      {/* Countdown Timer */}
      {hasValidActiveRound ? (
        <div style={{ marginBottom: 8 }}>
          <RoundTimer
            startTimestamp={Number(activeRound!.startTimestamp)}
            endTimestamp={Number(activeRound!.endTimestamp)}
            lockTimestamp={Number(activeRound!.lockTimestamp)}
            resolved={isActiveResolved}
            targetMode="lock"
          />
        </div>
      ) : (
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            padding: '10px 0',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            marginBottom: 8,
          }}
        >
          Awaiting active round creation...
        </div>
      )}

      {activeRound && (
        <>
          {/* Prices row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '6px 12px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENT PRICE</span>
              <PriceTicker price={currentBtcPrice} />
            </div>

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>LOCKED PRICE</span>
              <strong style={{ fontSize: 11, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {startPrice > 0 ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
              </strong>
            </div>
          </div>

          {/* YES/NO slider distribution */}
          <ProgressBar
            upPercent={activeUpPercent}
            downPercent={activeDownPercent}
          />

          {/* Sizing statistics / potential payouts */}
          <PoolStats
            totalPool={formattedTotal}
            upAmount={formattedUp}
            downAmount={formattedDown}
            upMultiplier={activeUpMultiplier}
            downMultiplier={activeDownMultiplier}
          />

          {/* Market state badge label */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>MARKET STATUS</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {getMarketStatusText()}
            </span>
          </div>
        </>
      )}
    </Card>
  );
});

ActiveRoundCard.displayName = 'ActiveRoundCard';
