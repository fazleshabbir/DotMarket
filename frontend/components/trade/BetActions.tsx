'use client';

import React, { memo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BetActionsProps {
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

export const BetActions = memo(function BetActions({
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
}: BetActionsProps) {
  // Simple quick actions in USDC
  const handleQuickAmount = (amount: string) => {
    setBetAmount(amount);
  };

  const isWorking = isPending || isConfirming;

  if (!isConnected) {
    return (
      <div style={{ marginTop: 10 }}>
        {connectWalletCTA}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {/* Bet input */}
      <Input
        type="number"
        step="1"
        placeholder="10"
        prefixSymbol="USDC"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        disabled={!canBet || isWorking}
        label="Bet Amount (USDC)"
      />

      {/* Quick amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {['10', '50', '250', '1000'].map((amt) => (
          <Button
            key={amt}
            variant="ghost"
            size="sm"
            onClick={() => handleQuickAmount(amt)}
            disabled={!canBet || isWorking}
            style={{
              padding: '6px 0',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            {amt}
          </Button>
        ))}
      </div>

      {/* Primary triggers: UP vs DOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Button
          variant="primary"
          size="md"
          onClick={() => onPlaceBet(0)}
          disabled={!canBet || isWorking || !betAmount}
          style={{
            background: '#ffffff',
            color: '#000000',
            fontWeight: 700,
            borderRadius: '12px',
            height: 38,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>▲ UP</span>
          <span style={{ fontSize: 9, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
            {upMultiplier > 0 ? `${upMultiplier.toFixed(2)}x` : '—'}
          </span>
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => onPlaceBet(1)}
          disabled={!canBet || isWorking || !betAmount}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px',
            height: 38,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>▼ DOWN</span>
          <span style={{ fontSize: 9, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
            {downMultiplier > 0 ? `${downMultiplier.toFixed(2)}x` : '—'}
          </span>
        </Button>
      </div>

      {/* Tx Log display */}
      {txStatus && (
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
          {txStatus}
        </div>
      )}
    </div>
  );
});

BetActions.displayName = 'BetActions';
