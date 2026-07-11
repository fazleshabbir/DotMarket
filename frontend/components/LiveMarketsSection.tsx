'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMotionSystem } from '@/hooks/useMotionSystem';

// Memoized Market Card Component to isolate re-render ticks
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
        height: '240px', // Reserve space before layout resolves to prevent CLS
      }}
    >
      {/* Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--up)' }} className="animate-pulse-live" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{pair}</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ID: {id}</span>
      </div>

      {/* Main Forecast Title */}
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{target}</h3>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Will price settle higher than current?</span>
      </div>

      {/* Probability bar distribution */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: '#ffffff' }}>YES {upPct}%</span>
          <span style={{ color: 'var(--text-secondary)' }}>NO {100 - upPct}%</span>
        </div>
        {/* Visual ratio bar */}
        <div style={{ height: 6, width: '100%', background: 'rgba(82, 82, 82, 0.2)', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${upPct}%`, background: '#ffffff', height: '100%', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${100 - upPct}%`, background: '#525252', height: '100%', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Vol / Time stats */}
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

      {/* Trade Button */}
      <Link href="/trade" style={{ textDecoration: 'none', width: '100%' }}>
        <Button variant="secondary" showArrow={true} arrowDirection="up-right" style={{ width: '100%' }}>
          Place Prediction
        </Button>
      </Link>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparator: only re-render card if statistics actually change
  return (
    prevProps.id === nextProps.id &&
    prevProps.vol === nextProps.vol &&
    prevProps.upPct === nextProps.upPct &&
    prevProps.time === nextProps.time
  );
});

MarketCard.displayName = 'MarketCard';

export function LiveMarketsSection() {
  const { revealCard, staggerContainer, shouldReduceMotion } = useMotionSystem();
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  // Wagmi reads for live BTC stats
  const { data: currentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 2000 },
  });

  const activeRoundId = currentRoundId ? BigInt(currentRoundId.toString()) : 0n;

  const { data: activeRoundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });
  const activeRound = activeRoundData as any;

  const [btcTimeLeft, setBtcTimeLeft] = useState<string>('0:00');

  useEffect(() => {
    if (!activeRound) return;
    const updateBtcTimeLeft = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const lockTs = Number(activeRound.lockTimestamp);
      const timeLeft = lockTs - nowSec;

      if (timeLeft <= 0) {
        setBtcTimeLeft('LOCKED');
      } else {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        setBtcTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };
    updateBtcTimeLeft();
    const interval = setInterval(updateBtcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeRound]);

  const btcVolume = activeRound 
    ? parseFloat(formatEther(activeRound.totalUpAmount + activeRound.totalDownAmount)).toFixed(2)
    : '0.00';

  const btcTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const btcUpPercent = btcTotalPool > 0n 
    ? Math.round(Number((activeRound.totalUpAmount * 100n) / btcTotalPool))
    : 50;

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
      id: activeRound ? `BTC-USD-${activeRound.roundId.toString()}` : 'BTC-USD-0', 
      vol: `${parseFloat(btcVolume).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC`, 
      upPct: btcUpPercent, 
      time: btcTimeLeft, 
      target: 'BTC/USD 1m Forecast' 
    },
    { 
      pair: 'ETH/USD', 
      id: 'ETH-USD-26', 
      vol: `${ethStats.vol.toLocaleString()} USDC`, 
      upPct: ethStats.upPct, 
      time: formatMinsSecs(ethStats.timeLeft), 
      target: 'ETH/USD 1m Forecast' 
    },
    { 
      pair: 'SOL/USD', 
      id: 'SOL-USD-26', 
      vol: `${solStats.vol.toLocaleString()} USDC`, 
      upPct: solStats.upPct, 
      time: formatMinsSecs(solStats.timeLeft), 
      target: 'SOL/USD 1m Forecast' 
    }
  ];

  return (
    <Section id="markets">
      <PageHeader
        title="Live Markets"
        subtitle="Real-time binary predictions currently active on the testnet."
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
          minHeight: '240px', // Reserve layout dimensions to prevent layout shifts
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
