'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Card } from './ui/Card';
import { Table, TableRow, TableCell } from './ui/Table';
import { Badge } from './ui/Badge';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '../hooks/useNetworkConfig';

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

export function PositionsTable() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [historyBets, setHistoryBets] = useState<Bet[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;
  const publicClient = usePublicClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer tick for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live price ticker from Binance
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const data = await res.json();
        if (data && data.price) {
          setBtcPrice(parseFloat(data.price));
        }
      } catch (err) {}
    };
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Bets from Smart Contract
  useEffect(() => {
    if (!publicClient || !address || !MARKET_ADDRESS) return;

    let isSubscribed = true;

    const fetchUserBets = async () => {
      try {
        // Read user's bet list
        const betIds = await publicClient.readContract({
          address: MARKET_ADDRESS,
          abi: ROUND_MARKET_ABI,
          functionName: 'getUserBets',
          args: [address],
        }) as bigint[];

        if (!isSubscribed) return;

        // Take last 20 bets to display
        const recentIds = betIds.slice(-20).reverse();

        const betsList = await Promise.all(
          recentIds.map(async (id) => {
            const data = await publicClient.readContract({
              address: MARKET_ADDRESS,
              abi: ROUND_MARKET_ABI,
              functionName: 'getBet',
              args: [id],
            }) as any;
            return {
              betId: data.betId,
              user: data.user,
              position: data.position,
              stake: data.stake,
              entryTime: data.entryTime,
              expiryTime: data.expiryTime,
              entryPrice: data.entryPrice,
              settlementPrice: data.settlementPrice,
              lockedMultiplier: data.lockedMultiplier,
              status: data.status,
              payout: data.payout,
              claimed: data.claimed,
            } as Bet;
          })
        );

        if (!isSubscribed) return;

        // Split active vs history
        const active = betsList.filter((b) => b.status === 0);
        const history = betsList.filter((b) => b.status !== 0);

        setActiveBets(active);
        setHistoryBets(history);
      } catch (err) {
        console.error('Error fetching bets in PositionsTable:', err);
      }
    };

    fetchUserBets();
    const interval = setInterval(fetchUserBets, 4000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [publicClient, address, MARKET_ADDRESS]);

  if (!mounted) {
    return (
      <Card hoverEffect={false} style={{ padding: '24px 20px', textAlign: 'center', minHeight: '220px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>LOADING TERMINAL ACTIVITY...</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card
        hoverEffect={false}
        style={{
          minHeight: '220px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
          gap: 12,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: 13, color: '#ffffff', marginBottom: 4, letterSpacing: '0.5px' }}>
            No Active Bets
          </strong>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.4 }}>
            Connect your wallet to place your first prediction.
          </p>
        </div>
      </Card>
    );
  }

  const currentBets = activeTab === 'positions' ? activeBets : historyBets;

  return (
    <Card 
      hoverEffect={false} 
      style={{ 
        overflow: 'hidden',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '220px',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Table Header Section */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.005)',
          padding: '10px 16px',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff' }}>
          YOUR ACTIVITY
        </span>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'positions' ? '#ffffff' : 'transparent',
              color: activeTab === 'positions' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            ACTIVE BETS ({activeBets.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            HISTORY ({historyBets.length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {currentBets.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 20 }}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="M16 11h.01M22 10h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#ffffff', fontWeight: 600 }}>
                {activeTab === 'positions' ? 'No Active Bets' : 'No History'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {activeTab === 'positions' ? 'Open positions will appear here.' : 'Resolved predictions will show history.'}
              </span>
            </div>
          </div>
        ) : (
          <Table
            headers={
              activeTab === 'positions'
                ? ['BET ID', 'FORECAST', 'AMOUNT', 'ENTRY PRICE', 'CURRENT PRICE', 'TIME LEFT', 'MULTIPLIER', 'POT. RETURN']
                : ['BET ID', 'FORECAST', 'AMOUNT', 'ENTRY PRICE', 'SETTLE PRICE', 'MULTIPLIER', 'RESULT', 'PROFIT/LOSS']
            }
          >
            {currentBets.map((bet) => {
              const isUp = bet.position === 0;
              const stakeUSDC = Number(bet.stake) / 1e18;
              const payoutUSDC = Number(bet.payout) / 1e18;
              const entryPrice = Number(bet.entryPrice) / 1e8;
              const settlementPrice = Number(bet.settlementPrice) / 1e8;
              const multiplier = Number(bet.lockedMultiplier) / 10000;
              const secondsLeft = Math.max(0, Number(bet.expiryTime) - now);

              // Position status logic
              const isWinning = isUp ? btcPrice > entryPrice : btcPrice < entryPrice;
              const isTie = btcPrice === entryPrice;
              const liveStatusColor = isTie ? 'var(--text-secondary)' : isWinning ? '#ffffff' : 'rgba(255,255,255,0.4)';

              // History status logic
              let statusLabel = 'RUNNING';
              let badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'outline' = 'default';
              let profitUSDC = 0;

              if (bet.status === 1) {
                statusLabel = 'WON';
                badgeVariant = 'success';
                profitUSDC = payoutUSDC - stakeUSDC;
              } else if (bet.status === 2) {
                statusLabel = 'LOST';
                badgeVariant = 'error';
                profitUSDC = -stakeUSDC;
              } else if (bet.status === 3) {
                statusLabel = 'PUSH';
                badgeVariant = 'outline';
                profitUSDC = 0;
              }

              if (activeTab === 'positions') {
                return (
                  <TableRow key={bet.betId.toString()}>
                    <TableCell style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      #{bet.betId.toString()}
                    </TableCell>
                    <TableCell>
                      <span 
                        style={{ 
                          color: isUp ? '#ffffff' : 'var(--text-secondary)', 
                          fontWeight: 700,
                          background: isUp ? 'rgba(255,255,255,0.06)' : 'rgba(82,82,82,0.15)',
                          padding: '3px 7px',
                          borderRadius: 5,
                          fontSize: 9,
                        }}
                      >
                        {isUp ? '▲ UP' : '▼ DOWN'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      {stakeUSDC.toFixed(2)} USDC
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)', color: liveStatusColor }}>
                      ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {secondsLeft > 0 ? `00:${secondsLeft.toString().padStart(2, '0')}` : 'SETTLING...'}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      {multiplier.toFixed(2)}x
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {(stakeUSDC * multiplier).toFixed(2)} USDC
                    </TableCell>
                  </TableRow>
                );
              } else {
                return (
                  <TableRow key={bet.betId.toString()}>
                    <TableCell style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      #{bet.betId.toString()}
                    </TableCell>
                    <TableCell>
                      <span 
                        style={{ 
                          color: isUp ? '#ffffff' : 'var(--text-secondary)', 
                          fontWeight: 700,
                          background: isUp ? 'rgba(255,255,255,0.06)' : 'rgba(82,82,82,0.15)',
                          padding: '3px 7px',
                          borderRadius: 5,
                          fontSize: 9,
                        }}
                      >
                        {isUp ? '▲ UP' : '▼ DOWN'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      {stakeUSDC.toFixed(2)} USDC
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      ${settlementPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)' }}>
                      {multiplier.toFixed(2)}x
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: profitUSDC > 0 ? '#ffffff' : profitUSDC === 0 ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)' }}>
                      {profitUSDC >= 0 ? '+' : ''}{profitUSDC.toFixed(2)} USDC
                    </TableCell>
                  </TableRow>
                );
              }
            })}
          </Table>
        )}
      </div>
    </Card>
  );
}
