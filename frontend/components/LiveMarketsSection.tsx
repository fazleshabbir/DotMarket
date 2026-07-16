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
        justifyContent: 'space-between',
        gap: 20,
        height: '100%',
        minHeight: '320px',
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px', marginBottom: 4 }}>{target}</h3>
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

// ── Isolated Connected Components to Prevent Section Re-renders ──
function ConnectedBtcMarketCard({ revealCardVariant }: { revealCardVariant: any }) {
  const market = useMarket();
  const { activeRound, timeLeftToLock } = market || {};

  const time = !market || !activeRound || timeLeftToLock === undefined
    ? '0:00'
    : timeLeftToLock <= 0
      ? 'LOCKED'
      : `${Math.floor(timeLeftToLock / 60)}:${(timeLeftToLock % 60).toString().padStart(2, '0')}`;

  const btcVolume = activeRound 
    ? parseFloat(formatEther(activeRound.totalUpAmount + activeRound.totalDownAmount)).toFixed(2)
    : '0.00';
  const volStr = `${parseFloat(btcVolume).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC`;

  const btcTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const upPct = btcTotalPool > 0n && activeRound
    ? Math.round(Number((activeRound.totalUpAmount * 100n) / btcTotalPool))
    : 50;

  const id = activeRound ? `BTC-USD-${activeRound.roundId.toString()}` : 'BTC-USD-0';

  return (
    <ScrollFade style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MarketCard 
        pair="BTC/USD"
        id={id}
        vol={volStr}
        upPct={upPct}
        time={time}
        target="BTC/USD 1m Forecast"
        revealCardVariant={revealCardVariant}
      />
    </ScrollFade>
  );
}

function SimulatedMarketCard({ 
  pair, idPrefix, baseTime, baseVol, volMult, basePct, pctMod, revealCardVariant 
}: { 
  pair: string, idPrefix: string, baseTime: number, baseVol: number, volMult: number, basePct: number, pctMod: number, revealCardVariant: any 
}) {
  const market = useMarket();
  const now = market?.now || 0;

  const timeLeft = baseTime === 240 ? 240 - (now % 240) : 240 - ((now + 120) % 240);
  const vol = baseVol + (now ? (now % (volMult * 333)) * volMult : 0);
  const pct = basePct + (now ? (now % pctMod) : 0);

  const timeStr = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <ScrollFade style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MarketCard 
        pair={pair}
        id={`${idPrefix}-26`}
        vol={`${vol.toLocaleString()} USDC`}
        upPct={pct}
        time={timeStr}
        target={`${pair} 1m Forecast`}
        revealCardVariant={revealCardVariant}
      />
    </ScrollFade>
  );
}

export function LiveMarketsSection() {
  const { revealCard, staggerContainer, viewport } = useMotionSystem();

  return (
    <Section id="markets">
      <PageHeader
        title="Live Markets"
        subtitle="Real-time binary predictions currently active on the testnet."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainer(0.08)}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
          gap: 24,
          willChange: 'transform, opacity',
        }}
      >
        <ConnectedBtcMarketCard revealCardVariant={revealCard} />
        <SimulatedMarketCard 
          pair="ETH/USD" idPrefix="ETH-USD" baseTime={240} baseVol={7800} 
          volMult={3} basePct={40} pctMod={20} revealCardVariant={revealCard} 
        />
        <SimulatedMarketCard 
          pair="SOL/USD" idPrefix="SOL-USD" baseTime={120} baseVol={4900} 
          volMult={2} basePct={50} pctMod={30} revealCardVariant={revealCard} 
        />
      </motion.div>
    </Section>
  );
}
