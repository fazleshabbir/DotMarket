'use client';

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableRow, TableCell } from '../ui/Table';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, BarChart2, Flame, Award, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  wallet: string;
  winRate: string;
  pnl: string;
  roi: string;
  volume: string;
  markets: number;
  streak: number;
  avgBet: string;
  lastActive: string;
}

export function LeaderboardView() {
  const { address, isConnected } = useAccount();
  
  const [activeRange, setActiveRange] = useState<'today' | 'weekly' | 'monthly' | 'alltime'>('weekly');
  const [sortBy, setSortBy] = useState<'roi' | 'volume' | 'winrate'>('roi');
  const [currentPage, setCurrentPage] = useState(1);

  // Generate realistic leaderboard ranking data
  const tradersList: LeaderboardUser[] = useMemo(() => {
    const list: LeaderboardUser[] = [
      { rank: 1, wallet: '0x7a8d...f302', winRate: '78.4%', pnl: '+4,820.00 USD', roi: '+24.5%', volume: '19,670 USD', markets: 112, streak: 8, avgBet: '175.60', lastActive: '2s ago' },
      { rank: 2, wallet: '0x32cf...998a', winRate: '74.1%', pnl: '+3,950.40 USD', roi: '+19.8%', volume: '19,950 USD', markets: 98, streak: 5, avgBet: '203.50', lastActive: '1m ago' },
      { rank: 3, wallet: '0x9d20...112e', winRate: '72.8%', pnl: '+3,120.00 USD', roi: '+18.2%', volume: '17,140 USD', markets: 142, streak: 3, avgBet: '120.70', lastActive: '4s ago' },
      { rank: 4, wallet: '0x0d3c...2f0d', winRate: '68.5%', pnl: '+2,450.00 USD', roi: '+15.4%', volume: '15,900 USD', markets: 76, streak: 4, avgBet: '209.20', lastActive: '14m ago' },
      { rank: 5, wallet: '0x88bb...001c', winRate: '65.2%', pnl: '+1,980.50 USD', roi: '+14.2%', volume: '13,940 USD', markets: 88, streak: 2, avgBet: '158.40', lastActive: '22m ago' },
      { rank: 6, wallet: '0xef02...771c', winRate: '63.9%', pnl: '+1,820.30 USD', roi: '+12.9%', volume: '14,100 USD', markets: 95, streak: 0, avgBet: '148.40', lastActive: '1h ago' },
      { rank: 7, wallet: '0x10d3...82ab', winRate: '61.4%', pnl: '+1,540.20 USD', roi: '+11.8%', volume: '12,500 USD', markets: 72, streak: 1, avgBet: '173.60', lastActive: '2h ago' },
      { rank: 8, wallet: '0x3a4b...e010', winRate: '59.7%', pnl: '+1,120.00 USD', roi: '+10.4%', volume: '10,750 USD', markets: 60, streak: 3, avgBet: '179.10', lastActive: '4h ago' },
      { rank: 9, wallet: '0x9cf2...ee02', winRate: '58.2%', pnl: '+980.40 USD', roi: '+9.2%', volume: '10,650 USD', markets: 85, streak: 0, avgBet: '125.30', lastActive: '5h ago' },
      { rank: 10, wallet: '0x712a...0b9c', winRate: '57.8%', pnl: '+890.00 USD', roi: '+8.7%', volume: '10,250 USD', markets: 54, streak: 2, avgBet: '164.80', lastActive: '6h ago' },
    ];

    // If wallet is connected, dynamically inject the user as Rank 12 on the board to showcase personalized rankings!
    if (isConnected && address) {
      const userRank: LeaderboardUser = {
        rank: 12,
        wallet: address.slice(0, 6) + '...' + address.slice(-4) + ' (You)',
        winRate: '68.2%',
        pnl: '+382.40 USD',
        roi: '+18.4%',
        volume: '2,080 USD',
        markets: 38,
        streak: 2,
        avgBet: '45.00',
        lastActive: 'Just now'
      };
      // Keep it in sorted position or place at rank 12
      list.push(userRank);
    }
    
    return list;
  }, [isConnected, address]);

  // Extract Podium (Top 3)
  const podiumTraders = useMemo(() => {
    // Top 3 always taken from base rankings
    return tradersList.slice(0, 3);
  }, [tradersList]);

  // Extract rest of table ranking list
  const remainingTraders = useMemo(() => {
    return tradersList.slice(3);
  }, [tradersList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', margin: 0 }}>
            Platform Leaderboard
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Season 1 Active • Dynamic prize pool calculations live
          </span>
        </div>

        {/* Global Time Filter */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px 6px', gap: '4px' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'alltime', label: 'All Time' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setActiveRange(range.id as any)}
              style={{
                background: activeRange === range.id ? '#ffffff' : 'transparent',
                color: activeRange === range.id ? '#000000' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Top Three Podium Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'end', marginTop: '12px' }}>
        {/* Render 2nd place on left, 1st place in middle (taller), 3rd place on right */}
        {[podiumTraders[1], podiumTraders[0], podiumTraders[2]].map((trader, idx) => {
          if (!trader) return null;
          const isFirst = trader.rank === 1;
          return (
            <motion.div
              key={trader.rank}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
              style={{
                background: 'rgba(5, 5, 5, 0.4)',
                border: isFirst ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                boxShadow: isFirst ? '0 10px 40px rgba(255,255,255,0.03)' : 'none',
                height: isFirst ? '260px' : '220px',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {/* Rank Medal Indicator */}
              <div style={{
                position: 'absolute',
                top: '-16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isFirst ? '#ffffff' : 'rgba(10, 10, 10, 0.9)',
                color: isFirst ? '#000000' : '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)'
              }}>
                {trader.rank}
              </div>

              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                {trader.wallet}
              </span>
              
              <div style={{ fontSize: '24px', fontWeight: 300, fontFamily: 'var(--font-mono)', margin: '8px 0', color: isFirst ? '#ffffff' : 'rgba(255,255,255,0.85)' }}>
                {trader.pnl}
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', fontSize: '11px' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>WIN RATE</div>
                  <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{trader.winRate}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>ROI</div>
                  <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{trader.roi}</strong>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. User Personal Ranking Summary ──────────────────────── */}
      {isConnected && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px 24px',
          gap: '20px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Trophy size={20} style={{ color: '#ffffff' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Current Rank</div>
              <strong style={{ fontSize: '16px', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>#12 of 1,280</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>YOUR PNL</span>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>+382.40 USD</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>YOUR ROI</span>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>+18.4%</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>YOUR WIN RATE</span>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>68.2%</div>
            </div>
          </div>

          {/* Progress bar to next rank */}
          <div style={{ flexGrow: 1, maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span>PROGRESS TO RANK #10</span>
              <strong style={{ color: '#ffffff' }}>74%</strong>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '74%', height: '100%', background: '#ffffff', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Full Leaderboard Table ──────────────────────────────── */}
      <div className="premium-card" style={{ padding: 0, border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', background: 'rgba(5, 5, 5, 0.2)' }}>
        
        {/* Table Filters header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>RANKINGS</span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'roi', label: 'ROI' },
              { id: 'volume', label: 'VOLUME' },
              { id: 'winrate', label: 'WIN RATE' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSortBy(filter.id as any)}
                style={{
                  background: sortBy === filter.id ? '#ffffff' : 'rgba(255,255,255,0.02)',
                  color: sortBy === filter.id ? '#000000' : 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '9px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div style={{ overflowX: 'auto' }}>
          <Table headers={['RANK', 'WALLET', 'WIN RATE', 'PNL', 'ROI', 'VOLUME', 'ACTIVE PREDICTIONS', 'STREAK', 'AVG ENTRY', 'LAST ACTIVE']}>
            {remainingTraders.map((trader) => {
              const isCurrentUser = trader.wallet.includes('(You)');
              return (
                <TableRow
                  key={trader.rank}
                  style={{
                    background: isCurrentUser ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    borderLeft: isCurrentUser ? '2px solid #ffffff' : '2px solid transparent'
                  }}
                >
                  <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{trader.rank}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', color: isCurrentUser ? '#ffffff' : 'var(--text-secondary)' }}>
                    {trader.wallet}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{trader.winRate}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{trader.pnl}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{trader.roi}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{trader.volume}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{trader.markets}</TableCell>
                  <TableCell>
                    {trader.streak > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff' }}>
                        <Flame size={12} fill="#ffffff" />
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{trader.streak}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{trader.avgBet} USD</TableCell>
                  <TableCell style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{trader.lastActive}</TableCell>
                </TableRow>
              );
            })}
          </Table>
        </div>

        {/* Sticky Table Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>Showing 7 rankings (page 1 of 1)</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" disabled style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', borderRadius: '8px' }}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="secondary" size="sm" disabled style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', borderRadius: '8px' }}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}
