'use client';

import React, { useEffect, useState, memo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { Section } from './ui/Section';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ProgressBar } from './trade/ProgressBar';
import { useMotionSystem } from '../hooks/useMotionSystem';
import { ScrollFade } from './ScrollFade';

interface MarketCardProps {
  pair: string;
  id: string;
  vol: string;
  upPct: number;
  time: string;
  target: string;
  revealCardVariant: Variants;
}

const MarketCard = memo(function MarketCard({
  pair,
  id,
  vol,
  upPct,
  time,
  target,
  revealCardVariant,
}: MarketCardProps) {
  const isBtc = pair === 'BTC/USD';

  return (
    <motion.div variants={revealCardVariant} style={{ height: '100%' }}>
      <Card
        hoverEffect={true}
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.015)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 22,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
              {pair}
            </span>
            <Badge variant={isBtc ? 'success' : 'outline'}>
              {isBtc ? '● LIVE' : 'SIMULATED'}
            </Badge>
          </div>

          {/* Under subtitle */}
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
            CONTRACT ID: {id}
          </div>

          {/* Forecast distribution progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, fontWeight: 550 }}>
              <span style={{ color: '#ffffff' }}>UP ({upPct}%)</span>
              <span style={{ color: 'var(--text-secondary)' }}>DOWN ({100 - upPct}%)</span>
            </div>
            <ProgressBar upPercent={upPct} downPercent={100 - upPct} />
          </div>
        </div>

        {/* Lower stats section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>
              Active Volume
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {vol}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>
              EXPIRY TIME
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {time}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.pair === nextProps.pair &&
    prevProps.id === nextProps.id &&
    prevProps.vol === nextProps.vol &&
    prevProps.upPct === nextProps.upPct &&
    prevProps.time === nextProps.time
  );
});

MarketCard.displayName = 'MarketCard';

export function LiveMarketsSection() {
  const { revealCard, staggerContainer } = useMotionSystem();
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  // Wagmi reads for live BTC stats
  const { data: activeUpPool } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'activeUpPool',
    query: { refetchInterval: 5000 },
  });

  const { data: activeDownPool } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'activeDownPool',
    query: { refetchInterval: 5000 },
  });

  const upPool = activeUpPool ? BigInt(activeUpPool.toString()) : 0n;
  const downPool = activeDownPool ? BigInt(activeDownPool.toString()) : 0n;
  const totalPool = upPool + downPool;

  const btcVolume = parseFloat(formatEther(totalPool)).toFixed(2);
  const btcUpPercent = totalPool > 0n ? Math.round(Number((upPool * 100n) / totalPool)) : 50;

  // Live simulation stats for other pairs (ETH, SOL)
  const [ethStats, setEthStats] = useState({ vol: 7830, upPct: 48, timeLeft: 148 });
  const [solStats, setSolStats] = useState({ vol: 4920, upPct: 65, timeLeft: 72 });

  useEffect(() => {
    const timer = setInterval(() => {
      setEthStats((prev) => {
        const nextTime = prev.timeLeft <= 1 ? 240 : prev.timeLeft - 1;
        const volChange = Math.random() > 0.9 ? Math.floor(Math.random() * 5) + 1 : 0;
        const pctChange = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return {
          vol: prev.vol + volChange,
          upPct: Math.max(30, Math.min(70, prev.upPct + pctChange)),
          timeLeft: nextTime,
        };
      });

      setSolStats((prev) => {
        const nextTime = prev.timeLeft <= 1 ? 240 : prev.timeLeft - 1;
        const volChange = Math.random() > 0.9 ? Math.floor(Math.random() * 5) + 1 : 0;
        const pctChange = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return {
          vol: prev.vol + volChange,
          upPct: Math.max(35, Math.min(75, prev.upPct + pctChange)),
          timeLeft: nextTime,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatMinsSecs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const marketsList = [
    { 
      pair: 'BTC/USD', 
      id: 'BTC-USD-CONTINUOUS', 
      vol: `${parseFloat(btcVolume).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC`, 
      upPct: btcUpPercent, 
      time: '60s (Live)', 
      target: 'BTC/USD 60s Forecast' 
    },
    { 
      pair: 'ETH/USD', 
      id: 'ETH-USD-CONTINUOUS', 
      vol: `${ethStats.vol.toLocaleString()} USDC`, 
      upPct: ethStats.upPct, 
      time: formatMinsSecs(ethStats.timeLeft), 
      target: 'ETH/USD 60s Forecast' 
    },
    { 
      pair: 'SOL/USD', 
      id: 'SOL-USD-CONTINUOUS', 
      vol: `${solStats.vol.toLocaleString()} USDC`, 
      upPct: solStats.upPct, 
      time: formatMinsSecs(solStats.timeLeft), 
      target: 'SOL/USD 60s Forecast' 
    }
  ];

  return (
    <Section id="markets">
      <PageHeader
        title="Live Markets"
        subtitle="Real-time USDC continuous binary predictions currently active on the testnet."
      />

      {/* Markets cards grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer(0.08)}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 24,
          minHeight: '240px',
        }}
      >
        {marketsList.map((m, idx) => (
          <ScrollFade key={idx}>
            <MarketCard 
              pair={m.pair}
              id={m.id}
              vol={m.vol}
              upPct={m.upPct}
              time={m.time}
              target={m.target}
              revealCardVariant={revealCard}
            />
          </ScrollFade>
        ))}
      </motion.div>
    </Section>
  );
}
