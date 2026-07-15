'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarket } from '@/lib/marketStore';
import { formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';

interface FeedItem {
  id: string;
  wallet: string;
  direction: 'UP' | 'DOWN';
  amount: string;
  roundId: string;
  ts: number;
}

// ── Generates a placeholder feed from mock data while contract events load ──
function generateSeedItems(): FeedItem[] {
  const wallets = ['0x7a8d...f302', '0x32cf...998a', '0x9d20...112e', '0x0d3c...2f0d', '0x88bb...001c', '0xef02...771c'];
  const directions: ('UP' | 'DOWN')[] = ['UP', 'DOWN', 'UP', 'UP', 'DOWN', 'UP'];
  const amounts = ['0.05', '0.10', '0.25', '0.08', '0.15', '0.30'];
  const now = Date.now();
  return wallets.map((w, i) => ({
    id: `seed-${i}`,
    wallet: w,
    direction: directions[i],
    amount: amounts[i],
    roundId: '17851',
    ts: now - (i + 1) * 18000,
  }));
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>(generateSeedItems());
  const [flash, setFlash] = useState<string | null>(null);
  const { currentRoundId, btcPrice, balanceSymbol } = useMarket();
  const contracts = useContracts();
  const publicClient = usePublicClient();
  const unwatchRef = useRef<(() => void) | null>(null);

  // ── Watch for real BetPlaced events ──────────────────────────────────────
  useEffect(() => {
    if (!publicClient || !contracts.predictionMarket) return;

    try {
      const unwatch = publicClient.watchContractEvent({
        address: contracts.predictionMarket,
        abi: ROUND_MARKET_ABI,
        eventName: 'BetPlaced',
        onLogs: (logs: any[]) => {
          const newItems: FeedItem[] = logs.map((log: any) => {
            const dir = log.args?.position === 0 ? 'UP' : 'DOWN';
            const amt = log.args?.amount ? parseFloat(formatEther(log.args.amount)).toFixed(4) : '?';
            const wallet = log.args?.user
              ? `${log.args.user.slice(0, 6)}...${log.args.user.slice(-4)}`
              : '0x????...????';
            return {
              id: `${log.transactionHash}-${log.logIndex}`,
              wallet,
              direction: dir,
              amount: amt,
              roundId: log.args?.roundId?.toString() ?? '?',
              ts: Date.now(),
            };
          });
          if (newItems.length === 0) return;
          setItems(prev => [...newItems, ...prev].slice(0, 20));
          setFlash(newItems[0].id);
          setTimeout(() => setFlash(null), 1200);
        },
      });
      unwatchRef.current = unwatch;
    } catch {
      // publicClient may not support watchContractEvent on all chains — fail silently
    }

    return () => { unwatchRef.current?.(); };
  }, [publicClient, contracts.predictionMarket]);

  // ── Tick timestamps every 15s ─────────────────────────────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#fff',
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            animation: 'pulseLive 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)' }}>
            LIVE ACTIVITY
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Round #{currentRoundId?.toString() ?? '—'}
        </span>
      </div>

      {/* Feed list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
        scrollbarWidth: 'none',
      }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              transition: 'background 400ms ease, opacity 400ms ease',
              background: flash === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
              opacity: i > 12 ? 0.4 : i > 8 ? 0.65 : 1,
              borderBottom: '1px solid rgba(255,255,255,0.025)',
            }}
          >
            {/* Direction icon */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.direction === 'UP' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${item.direction === 'UP' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {item.direction === 'UP'
                ? <ArrowUpRight size={13} style={{ color: '#ffffff' }} />
                : <ArrowDownRight size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />}
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.6)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.wallet}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                <span style={{ color: item.direction === 'UP' ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                  {item.direction}
                </span>
                {' · '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{item.amount} {balanceSymbol}</span>
              </div>
            </div>

            {/* Time */}
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
              {timeAgo(item.ts)}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulseLive {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(255,255,255,0.8); }
          50% { opacity: 0.4; box-shadow: 0 0 2px rgba(255,255,255,0.3); }
        }
      `}</style>
    </div>
  );
}
