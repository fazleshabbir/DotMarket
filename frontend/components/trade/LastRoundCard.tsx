'use client';

import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';

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

interface LastRoundCardProps {
  historyBets: Bet[];
}

export const LastRoundCard = memo(function LastRoundCard({
  historyBets,
}: LastRoundCardProps) {
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
        gap: 12,
        opacity: 0.95,
        transition: 'border-color 300ms ease, opacity 300ms ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#ffffff' }}>
          BET HISTORY
        </div>
        <StatusBadge status="settled" label="✓ SETTLED" />
      </div>

      {/* ── History Items ── */}
      {historyBets.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.05)',
            borderRadius: 12,
            fontSize: 10,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          NO HISTORICAL BETS
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
          {historyBets.map((bet) => {
            const isUp = bet.position === 0;
            const stakeUSDC = Number(bet.stake) / 1e18;
            const payoutUSDC = Number(bet.payout) / 1e18;
            const entryPrice = Number(bet.entryPrice) / 1e8;
            const settlementPrice = Number(bet.settlementPrice) / 1e8;
            const multiplier = Number(bet.lockedMultiplier) / 10000;

            // Result values
            let resultText = 'LOST';
            let resultColor = 'rgba(255,255,255,0.4)';
            let profitUSDC = -stakeUSDC;

            if (bet.status === 1) {
              resultText = 'WON';
              resultColor = '#ffffff';
              profitUSDC = payoutUSDC - stakeUSDC;
            } else if (bet.status === 3) {
              resultText = 'PUSH';
              resultColor = 'var(--text-secondary)';
              profitUSDC = 0;
            }

            // Entry timestamp formatting
            const date = new Date(Number(bet.entryTime) * 1000);
            const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={bet.betId.toString()}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: isUp ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        background: isUp ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {isUp ? 'UP' : 'DOWN'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {timeString}
                    </span>
                  </div>

                  <strong style={{ fontSize: 10, color: resultColor, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    {resultText}
                  </strong>
                </div>

                {/* Prices & Stake Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>STAKE</div>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{stakeUSDC.toFixed(2)} USDC</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>ENTRY</div>
                    <div style={{ color: '#ffffff' }}>${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>SETTLE</div>
                    <div style={{ color: '#ffffff' }}>${settlementPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
                  </div>
                </div>

                {/* Financial Payout details */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    borderTop: '1px dashed rgba(255,255,255,0.04)',
                    paddingTop: 4,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>MULT: </span>
                    <span style={{ color: '#ffffff' }}>{multiplier.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>PROFIT/LOSS: </span>
                    <strong style={{ color: profitUSDC > 0 ? '#ffffff' : profitUSDC === 0 ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)' }}>
                      {profitUSDC >= 0 ? '+' : ''}{profitUSDC.toFixed(2)} USDC
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});

LastRoundCard.displayName = 'LastRoundCard';
