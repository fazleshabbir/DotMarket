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
}: BetActionsProps) {
  // Simple quick actions
  const handleQuickPercent = (pct: number) => {
    // For testnet, let's hardcode easy mock values (e.g. 0.05, 0.1, 0.25, 0.5 ETH)
    if (pct === 25) setBetAmount('0.05');
    if (pct === 50) setBetAmount('0.10');
    if (pct === 75) setBetAmount('0.25');
    if (pct === 100) setBetAmount('0.50');
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
        step="0.01"
        placeholder="0.00"
        prefixSymbol="Ξ"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        disabled={!canBet || isWorking}
        label="Bet Amount (ETH)"
      />

      {/* Percentage triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[25, 50, 75, 100].map((pct) => (
          <Button
            key={pct}
            variant="ghost"
            size="sm"
            onClick={() => handleQuickPercent(pct)}
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
            {pct === 100 ? 'MAX' : `${pct}%`}
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
            height: 36,
          }}
        >
          ▲ UP
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
            height: 36,
          }}
        >
          ▼ DOWN
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
