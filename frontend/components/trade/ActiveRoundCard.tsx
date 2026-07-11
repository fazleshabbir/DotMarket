'use client';

import React, { memo, useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { PoolStats } from './PoolStats';
import { PriceTicker } from './PriceTicker';

interface Bet {
  betId: bigint;
  user: string;
  position: number; // 0 = UP, 1 = DOWN
  stake: bigint;
  entryTime: bigint;
  expiryTime: bigint;
  entryPrice: bigint;
  settlementPrice: bigint;
  lockedMultiplier: bigint;
  status: number; // 0 = Running, 1 = Won, 2 = Lost, 3 = Push
  payout: bigint;
  claimed: boolean;
}

interface ActiveRoundCardProps {
  currentBtcPrice: number;
  totalUpPool: bigint;
  totalDownPool: bigint;
  virtualUp: bigint;
  virtualDown: bigint;
  upMultiplier: number;
  downMultiplier: number;
  activeBets: Bet[];
}

export const ActiveRoundCard = memo(function ActiveRoundCard({
  currentBtcPrice,
  totalUpPool,
  totalDownPool,
  virtualUp,
  virtualDown,
  upMultiplier,
  downMultiplier,
  activeBets,
}: ActiveRoundCardProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pool math
  const liveUpPool = totalUpPool + virtualUp;
  const liveDownPool = totalDownPool + virtualDown;
  const totalPoolVal = liveUpPool + liveDownPool;

  const upPercent = totalPoolVal > 0n ? Number((liveUpPool * 10000n) / totalPoolVal) / 100 : 50;
  const downPercent = totalPoolVal > 0n ? 100 - upPercent : 50;

  const formattedTotal = (Number(totalPoolVal) / 1e18).toFixed(2);
  const formattedUp = (Number(liveUpPool) / 1e18).toFixed(2);
  const formattedDown = (Number(liveDownPool) / 1e18).toFixed(2);

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
        gap: 12,
        transition: 'border-color 300ms ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#ffffff' }}>
          LIVE MARKET
        </div>
        <StatusBadge status="ready" label="● OPEN" />
      </div>

      {/* ── Price Ticker ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em' }}>BTC/USD PRICE</span>
          <PriceTicker price={currentBtcPrice} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em' }}>STATUS</span>
          <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>CONTINUOUS</span>
        </div>
      </div>

      {/* ── Pool Stats & Distribution ── */}
      <ProgressBar upPercent={upPercent} downPercent={downPercent} />

      <PoolStats
        totalPool={formattedTotal}
        upAmount={formattedUp}
        downAmount={formattedDown}
        upMultiplier={upMultiplier}
        downMultiplier={downMultiplier}
      />

      {/* ── Active Bets Segment ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
            ACTIVE BETS ({activeBets.length})
          </span>
        </div>

        {activeBets.length === 0 ? (
          <div
            style={{
              padding: '14px',
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.05)',
              borderRadius: 12,
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            NO ACTIVE BETS
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            {activeBets.map((bet) => {
              const secondsLeft = Math.max(0, Number(bet.expiryTime) - now);
              const progressPercent = Math.min(100, (secondsLeft / 60) * 100);
              const entryPrice = Number(bet.entryPrice) / 1e8;
              const isUp = bet.position === 0;
              const stakeUSDC = Number(bet.stake) / 1e18;
              const multiplier = Number(bet.lockedMultiplier) / 10000;
              const estReturn = stakeUSDC * multiplier;
              const estProfit = estReturn - stakeUSDC;

              // Color indicators
              const isWinning = isUp ? currentBtcPrice > entryPrice : currentBtcPrice < entryPrice;
              const isTie = currentBtcPrice === entryPrice;
              const liveStatusColor = isTie ? 'var(--text-secondary)' : isWinning ? '#ffffff' : 'rgba(255,255,255,0.4)';

              return (
                <div
                  key={bet.betId.toString()}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {/* Bet Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isUp ? '#ffffff' : 'rgba(255,255,255,0.6)',
                          background: isUp ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {isUp ? 'UP' : 'DOWN'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {stakeUSDC.toFixed(2)} USDC
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {secondsLeft > 0 ? `00:${secondsLeft.toString().padStart(2, '0')}` : 'SETTLING...'}
                    </div>
                  </div>

                  {/* Bet Progress Bar */}
                  <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: '#ffffff',
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>

                  {/* Pricing Comparison */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>ENTRY: </span>
                      <span style={{ color: '#ffffff' }}>${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>LIVE: </span>
                      <span style={{ color: liveStatusColor }}>${currentBtcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Return Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: 4 }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>MULT: </span>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{multiplier.toFixed(2)}x</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>POT. RET: </span>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>{estReturn.toFixed(2)} USDC</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
});

ActiveRoundCard.displayName = 'ActiveRoundCard';
