'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { useMarket } from '@/lib/marketStore';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMotionSystem } from '@/hooks/useMotionSystem';

interface MarketCardProps {
  pair: string;
  id: string;
  vol: string;
  upPct: number;
  time: string;
  target: string;
  revealCardVariant: any;
}

const MarketCard = memo(({ pair, id, vol, upPct, time, target, revealCardVariant }: MarketCardProps) => {
  return (
    <Card 
      style={{ 
        padding: 24, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 20,
        height: '240px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--up)' }} className="animate-pulse-live" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{pair}</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ID: {id}</span>
      </div>

      <div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{target}</h3>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Will price settle higher than current?</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: '#ffffff' }}>YES {upPct}%</span>
          <span style={{ color: 'var(--text-secondary)' }}>NO {100 - upPct}%</span>
        </div>
        <div style={{ height: 6, width: '100%', background: 'rgba(82, 82, 82, 0.2)', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${upPct}%`, background: '#ffffff', height: '100%', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${100 - upPct}%`, background: '#525252', height: '100%', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, fontSize: 12 }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>VOLUME:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{vol}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>TIME LEFT:</span>{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{time}</strong>
        </div>
      </div>

      <Link href="/trade" style={{ textDecoration: 'none', width: '100%' }}>
        <Button variant="secondary" showArrow={true} arrowDirection="up-right" style={{ width: '100%' }}>
          Place Prediction
        </Button>
      </Link>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.vol === nextProps.vol &&
    prevProps.upPct === nextProps.upPct &&
    prevProps.time === nextProps.time
  );
});
MarketCard.displayName = 'MarketCard';

export function LiveMarketsSection() {
  const { revealCard, staggerContainer } = useMotionSystem();
  
  // Use authoritative global clock from marketStore
  const market = useMarket();
  const { activeRound, timeLeftToLock, now } = market || {};

  // Compute purely from global state
  const btcTimeLeft = !market || !activeRound || timeLeftToLock === undefined
    ? '0:00'
    : timeLeftToLock <= 0
      ? 'LOCKED'
      : `${Math.floor(timeLeftToLock / 60)}:${(timeLeftToLock % 60).toString().padStart(2, '0')}`;

  const btcVolume = activeRound 
    ? parseFloat(formatEther(activeRound.totalUpAmount + activeRound.totalDownAmount)).toFixed(2)
    : '0.00';

  const btcTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const btcUpPercent = btcTotalPool > 0n 
    ? Math.round(Number((activeRound.totalUpAmount * 100n) / btcTotalPool))
    : 50;

  // Fake ETH/SOL simulation derived from central `now` to keep them animated
  // without needing their own rogue setIntervals
  const ethTimeLeft = now ? 240 - (now % 240) : 240;
  const solTimeLeft = now ? 240 - ((now + 120) % 240) : 120;
  
  // Deterministic fake volume/percentages based on current time
  const ethVol = 7800 + (now ? (now % 1000) * 3 : 0);
  const solVol = 4900 + (now ? (now % 800) * 2 : 0);
  const ethPct = 40 + (now ? (now % 20) : 0);
  const solPct = 50 + (now ? (now % 30) : 0);

  const formatMinsSecs = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const marketsList = [
    { 
      pair: 'BTC/USD', 
      id: activeRound ? `BTC-USD-${activeRound.roundId.toString()}` : 'BTC-USD-0', 
      vol: `${parseFloat(btcVolume).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC`, 
      upPct: btcUpPercent, 
      time: btcTimeLeft, 
      target: 'BTC/USD 1m Forecast' 
    },
    { 
      pair: 'ETH/USD', 
      id: 'ETH-USD-26', 
      vol: `${ethVol.toLocaleString()} USDC`, 
      upPct: ethPct, 
      time: formatMinsSecs(ethTimeLeft), 
      target: 'ETH/USD 1m Forecast' 
    },
    { 
      pair: 'SOL/USD', 
      id: 'SOL-USD-26', 
      vol: `${solVol.toLocaleString()} USDC`, 
      upPct: solPct, 
      time: formatMinsSecs(solTimeLeft), 
      target: 'SOL/USD 1m Forecast' 
    }
  ];

  return (
    <Section id="markets">
      <PageHeader
        title="Live Markets"
        subtitle="Real-time binary predictions currently active on the testnet."
      />

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
