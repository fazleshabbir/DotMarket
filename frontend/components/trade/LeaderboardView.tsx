'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Zap, Users, BarChart2, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  {
    icon: <Trophy size={18} />,
    title: 'Global Rankings',
    desc: 'Compete with traders worldwide ranked by win rate, PnL, and total volume.',
  },
  {
    icon: <BarChart2 size={18} />,
    title: 'Performance Analytics',
    desc: 'Drill into prediction accuracy, streak data, and profit metrics per trader.',
  },
  {
    icon: <Users size={18} />,
    title: 'Social Profiles',
    desc: 'Follow top predictors, study their strategies, and track their live positions.',
  },
  {
    icon: <Zap size={18} />,
    title: 'Reward Seasons',
    desc: 'Earn protocol rewards and exclusive NFTs based on your seasonal ranking.',
  },
];

// Animated orbital dots around the trophy
function OrbitalRing({ radius, duration, dotCount = 3, opacity = 0.15 }: {
  radius: number; duration: number; dotCount?: number; opacity?: number;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle  = (i / dotCount) * 360;
        const delay  = (i / dotCount) * -duration;
        const size   = i === 0 ? 5 : 3;
        return (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: size, height: size,
            marginTop: -size / 2, marginLeft: -size / 2,
            borderRadius: '50%',
            background: '#fff',
            opacity,
            animation: `orbit${radius} ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
            transformOrigin: `0 0`,
            transform: `rotate(${angle}deg) translateX(${radius}px)`,
          }} />
        );
      })}
    </div>
  );
}

// Animated scan-line grid
function GridBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Vertical lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`v${i}`} style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${(i / 12) * 100}%`,
          width: 1,
          background: 'rgba(255,255,255,0.03)',
        }} />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`h${i}`} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${(i / 8) * 100}%`,
          height: 1,
          background: 'rgba(255,255,255,0.03)',
        }} />
      ))}
      {/* Radial fade overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 70% at 50% 40%, transparent 0%, #000 80%)',
      }} />
    </div>
  );
}

// Fake leaderboard skeleton rows for depth
function SkeletonRow({ rank, delay }: { rank: number; delay: number }) {
  const widths = [40, 55, 48, 35, 50, 38];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 80px 80px 80px 60px',
        gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        alignItems: 'center',
        filter: 'blur(3px)',
        opacity: 0.35 - rank * 0.04,
      }}
    >
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        {rank}
      </div>
      {widths.map((w, i) => (
        <div key={i} style={{
          height: 10, borderRadius: 4,
          background: 'rgba(255,255,255,0.08)',
          width: `${w}%`,
          animation: `shimmer 2s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </motion.div>
  );
}

export function LeaderboardView() {
  const [glowPhase, setGlowPhase] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setGlowPhase(p => !p), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <GridBackground />

      <style>{`
        @keyframes orbit120 {
          from { transform: rotate(var(--start-angle)) translateX(120px) rotate(calc(-1 * var(--start-angle))); }
          to   { transform: rotate(calc(var(--start-angle) + 360deg)) translateX(120px) rotate(calc(-1 * (var(--start-angle) + 360deg))); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%        { opacity: 0.8; }
        }
        @keyframes floatTrophy {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ringRotateRev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Blurred skeleton leaderboard behind ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10%', pointerEvents: 'none' }}>
        <div style={{
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.01)',
          maxWidth: 700, margin: '0 auto', width: '100%',
        }}>
          {/* Fake header */}
          <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '32px 1fr 80px 80px 80px 60px', gap: 12 }}>
            {['#', 'TRADER', 'WIN RATE', 'TOTAL PNL', 'VOLUME', 'BETS'].map((h, i) => (
              <div key={i} style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', width: i === 1 ? '50%' : '70%' }} />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonRow key={i} rank={i + 1} delay={i * 0.06} />
          ))}
        </div>
      </div>

      {/* ── Main "Coming Soon" card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 900,
          width: '100%',
          background: 'rgba(6, 6, 6, 0.85)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        {/* Left Section: Info */}
        <div style={{ flex: '1.1', padding: '48px 44px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 24, textAlign: 'left' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Trophy icon with orbital rings */}
            <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer orbital ring SVG */}
              <svg width={72} height={72} style={{ position: 'absolute', animation: 'ringRotate 12s linear infinite' }}>
                <circle cx={36} cy={36} r={34} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 8" />
              </svg>
              {/* Trophy center */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: glowPhase
                  ? '0 0 20px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 0 8px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
                transition: 'box-shadow 1.2s ease',
                animation: 'floatTrophy 4s ease-in-out infinite',
              }}>
                <Trophy size={20} style={{ color: '#ffffff' }} />
              </div>
            </div>

            {/* Lock badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px' }}>
              <Lock size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>COMING SOON</span>
            </div>
          </div>

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 34, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', lineHeight: 1.1 }}>
              Leaderboard
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
              On-chain rankings are being indexed from the contract. The leaderboard will go live once enough round data is collected.
            </p>
          </div>

          <div style={{ flexGrow: 1 }} />

          {/* Footer inside Left Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
              Continue trading to contribute to the rankings data.
            </p>
            <a
              href="#"
              onClick={e => { e.preventDefault(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 600, transition: 'color 150ms' }}
            >
              Go to Live Market <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: 1, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }} />

        {/* Right Section: Feature Grid */}
        <div style={{ flex: '1', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.015) 0%, transparent 100%)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <div style={{ color: 'var(--text-3)' }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
