'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          color: '#555',
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
      >
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="glass-card"
        style={{
          padding: '8px 16px',
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-accent)',
          background: 'var(--bg-card)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--up)' }} />
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      style={{
        padding: '10px 20px',
        borderRadius: 10,
        cursor: isPending ? 'wait' : 'pointer',
        fontSize: 14,
        fontWeight: 600,
        color: '#000',
        background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
        border: 'none',
        boxShadow: '0px 4px 12px rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
