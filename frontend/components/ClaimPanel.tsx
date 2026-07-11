'use client';

import React from 'react';
import { Card } from './ui/Card';

export function ClaimPanel() {
  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '24px 20px',
        textAlign: 'center',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
        Automatic Settlement
      </div>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.4 }}>
        Winnings and pushes are settled and paid out automatically into your connected wallet 60 seconds after bet placement. No manual claiming is required.
      </p>
    </Card>
  );
}
