'use client';

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Calendar, Search, SlidersHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface HistoryRecord {
  roundId: string;
  entryPrice: string;
  closePrice: string;
  outcome: 'UP' | 'DOWN' | 'TIE';
  totalPool: string;
  upPool: string;
  downPool: string;
  multiplier: string;
  resolvedTime: string;
}

export function HistoryView() {
  const { isConnected } = useAccount();
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'up' | 'down'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock complete global market historical data
  const historyData: HistoryRecord[] = useMemo(() => {
    return [
      { roundId: '17851', entryPrice: '58,410.50', closePrice: '58,422.30', outcome: 'UP', totalPool: '4.85 ETH', upPool: '2.50 ETH', downPool: '2.35 ETH', multiplier: '1.94x', resolvedTime: '1m ago' },
      { roundId: '17850', entryPrice: '58,435.00', closePrice: '58,405.10', outcome: 'DOWN', totalPool: '6.12 ETH', upPool: '3.80 ETH', downPool: '2.32 ETH', multiplier: '2.63x', resolvedTime: '2m ago' },
      { roundId: '17849', entryPrice: '58,390.80', closePrice: '58,432.00', outcome: 'UP', totalPool: '3.90 ETH', upPool: '1.90 ETH', downPool: '2.00 ETH', multiplier: '2.05x', resolvedTime: '3m ago' },
      { roundId: '17848', entryPrice: '58,450.20', closePrice: '58,412.00', outcome: 'DOWN', totalPool: '5.20 ETH', upPool: '2.80 ETH', downPool: '2.40 ETH', multiplier: '2.16x', resolvedTime: '4m ago' },
      { roundId: '17847', entryPrice: '58,412.00', closePrice: '58,412.00', outcome: 'TIE', totalPool: '4.00 ETH', upPool: '2.00 ETH', downPool: '2.00 ETH', multiplier: '1.00x', resolvedTime: '5m ago' },
      { roundId: '17846', entryPrice: '58,380.00', closePrice: '58,395.40', outcome: 'UP', totalPool: '7.45 ETH', upPool: '4.20 ETH', downPool: '3.25 ETH', multiplier: '1.77x', resolvedTime: '6m ago' },
      { roundId: '17845', entryPrice: '58,420.50', closePrice: '58,401.20', outcome: 'DOWN', totalPool: '5.90 ETH', upPool: '2.10 ETH', downPool: '3.80 ETH', multiplier: '1.55x', resolvedTime: '7m ago' },
      { roundId: '17844', entryPrice: '58,400.00', closePrice: '58,415.80', outcome: 'UP', totalPool: '3.50 ETH', upPool: '1.60 ETH', downPool: '1.90 ETH', multiplier: '2.18x', resolvedTime: '8m ago' }
    ];
  }, []);

  const filteredHistory = useMemo(() => {
    return historyData.filter(record => {
      const matchesSearch = record.roundId.includes(searchQuery);
      const matchesOutcome = 
        filterOutcome === 'all' || 
        (filterOutcome === 'up' && record.outcome === 'UP') || 
        (filterOutcome === 'down' && record.outcome === 'DOWN');
      return matchesSearch && matchesOutcome;
    });
  }, [historyData, filterOutcome, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', margin: 0 }}>
          Market Round History
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Review on-chain settlement prices, pool sizes, and win payout metrics
        </span>
      </div>

      {/* ── 2. Filters Grid ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'rgba(5, 5, 5, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' }}>
        
        {/* Search by Round ID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>SEARCH BY ROUND ID</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="e.g. 17851"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '10px 12px 10px 36px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                transition: 'all 200ms ease'
              }}
              className="search-input"
            />
          </div>
        </div>

        {/* Filter by Outcome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>OUTCOME</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px' }}>
            {['all', 'up', 'down'].map((out) => (
              <button
                key={out}
                onClick={() => setFilterOutcome(out as any)}
                style={{
                  flex: 1,
                  background: filterOutcome === out ? '#ffffff' : 'transparent',
                  color: filterOutcome === out ? '#000000' : 'rgba(255,255,255,0.6)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
              >
                {out}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Summary Statistic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE ROUNDS FILTERED</span>
          <div style={{ height: '36px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {filteredHistory.length} Rounds
          </div>
        </div>

      </div>

      {/* ── 3. History Archive Table ──────────────────────────────── */}
      <div className="premium-card" style={{ padding: 0, border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', background: 'rgba(5, 5, 5, 0.2)' }}>
        <div style={{ overflowX: 'auto' }}>
          {filteredHistory.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>No Completed Markets</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>No round matches the search queries.</span>
            </div>
          ) : (
            <Table headers={['ROUND ID', 'LOCK (ENTRY) PRICE', 'SETTLED PRICE', 'OUTCOME', 'TOTAL POOL', 'UP / DOWN RATIO', 'PAYOUT MULT', 'AGE']}>
              {filteredHistory.map((record) => (
                <TableRow key={record.roundId}>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{record.roundId}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>${record.entryPrice}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>${record.closePrice}</TableCell>
                  <TableCell>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: record.outcome === 'UP' ? '#ffffff' : record.outcome === 'DOWN' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)'
                    }}>
                      {record.outcome === 'UP' ? (
                        <ArrowUpRight size={12} />
                      ) : record.outcome === 'DOWN' ? (
                        <ArrowDownRight size={12} />
                      ) : null}
                      <span>{record.outcome}</span>
                    </span>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{record.totalPool}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {record.upPool} / {record.downPool}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{record.multiplier}</TableCell>
                  <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{record.resolvedTime}</TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </div>
      </div>

    </div>
  );
}
