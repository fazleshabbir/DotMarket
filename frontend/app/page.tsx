'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI, MARKET_ADDRESS } from '@/lib/abi';
import { StarryBackground } from '@/components/StarryBackground';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { ScrollFade } from '@/components/ScrollFade';

// Minimal Web3 SVG Line-Art Icons
interface IconProps {
  size?: number;
}

const KeyIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" />
  </svg>
);

const DiamondIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M11 3L8 9l4 12 4-12-3-6" />
    <path d="M2 9h20" />
  </svg>
);

const LightningIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const GlobeIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ScaleIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="7" y1="7" x2="17" y2="7" />
    <path d="M5 21a2 2 0 0 1-2-2v-5h4v5a2 2 0 0 1-2 2z" />
    <path d="M19 21a2 2 0 0 1-2-2v-5h4v5a2 2 0 0 1-2 2z" />
    <path d="M5 7L3 14h4z" />
    <path d="M19 7l-2 14h4z" />
  </svg>
);

const ScrollIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const TimerIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const WalletIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M16 8h5v8h-5z" />
    <circle cx="18" cy="12" r="1" />
  </svg>
);

const ChartIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TargetIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const GiftIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const ShieldIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LinkIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LockIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UsersIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DatabaseIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="10" x2="6" y2="14" />
    <line x1="18" y1="10" x2="18" y2="14" />
  </svg>
);

// Reusable animated count-up statistic component using IntersectionObserver
interface AnimatedStatProps {
  value: string;
  suffix?: string;
  duration?: number;
}

function AnimatedStat({ value, suffix = '', duration = 1500 }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Parse float from value string (e.g. "42.8" from "42.8")
          const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (isNaN(numericPart)) {
            setDisplayValue(value);
            return;
          }

          const isPercent = value.includes('%');
          const isDecimal = value.includes('.');
          
          let start = 0;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Easing function (easeOutQuad)
            const easeProgress = progress * (2 - progress);
            const currentCount = numericPart * easeProgress;

            if (isDecimal) {
              setDisplayValue(currentCount.toFixed(2));
            } else {
              setDisplayValue(Math.floor(currentCount).toString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}{suffix}</span>;
}

// Reusable FAQ Accordion Component
interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      style={{ 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: isOpen ? 'rgba(255, 255, 255, 0.005)' : 'transparent',
        transition: 'background-color 0.3s ease'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="faq-accordion-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '22px 24px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '15px'
        }}
      >
        <span>{question}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.7
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div
        ref={contentRef}
        className="faq-accordion-content"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '0 24px 24px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [sentiment, setSentiment] = useState(54);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200); // Default to desktop layout
  const [menuOpen, setMenuOpen] = useState(false);

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
  const btcDownPercent = 100 - btcUpPercent;

  // Live simulation stats for other pairs
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

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSentiment((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(35, Math.min(65, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isMobile = isMounted && windowWidth < 768;
  const isTablet = isMounted && windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = !isMounted || windowWidth >= 1024;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#ffffff', background: '#000000', overflowX: 'hidden' }}>
      
      {/* ── Background Aesthetics ────────────────────────────────── */}
      <StarryBackground />

      {/* Grid Pattern Background overlay matching Vercel/Linear aesthetic */}
      <div 
        className="animate-grid-move"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Ambient Radial Gradient Nodes */}
      <div 
        className="animate-pulse-slow"
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: '55%',
          right: '10%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(82, 82, 82, 0.05) 0%, transparent 60%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Header / Navigation ──────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          margin: isDesktop ? '24px 24px 0' : '12px 12px 0',
          padding: isDesktop ? '12px 24px' : '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 16,
          background: 'rgba(5, 5, 5, 0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 200 60" width={isDesktop ? "160" : "130"} height={isDesktop ? "48" : "39"} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="headerLogoMask">
                <rect x="0" y="0" width="200" height="60" fill="white" />
                <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
              </mask>
            </defs>
            <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#headerLogoMask)" />
            <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
            <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
            <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
          </svg>
        </div>

        {/* Center Nav Link capsule */}
        {isDesktop && (
          <nav
            style={{
              display: 'flex',
              gap: 24,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 24,
              padding: '6px 24px',
              alignItems: 'center',
            }}
          >
            {['Markets', 'Features', 'How It Works', 'Stats', 'FAQ'].map((tab) => (
              <a
                key={tab}
                href={`#${tab.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {tab}
              </a>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        {isDesktop ? (
          <Link href="/trade" style={{ textDecoration: 'none' }}>
            <button
              className="glass-card"
              style={{
                padding: '8px 22px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.03)',
                transition: 'all 0.3s ease',
              }}
            >
              Start Trading
            </button>
          </Link>
        ) : (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        )}

        {/* Mobile Navigation Drawer */}
        {!isDesktop && menuOpen && (
          <div
            className="animate-slide-in-right"
            style={{
              position: 'fixed',
              top: 70,
              right: 12,
              left: 12,
              background: 'rgba(5, 5, 5, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              zIndex: 999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            {['Markets', 'Features', 'How It Works', 'Stats', 'FAQ'].map((tab) => (
              <a
                key={tab}
                href={`#${tab.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                {tab}
              </a>
            ))}
            <Link href="/trade" style={{ textDecoration: 'none', marginTop: 8 }} onClick={() => setMenuOpen(false)}>
              <button
                className="btn-up"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Start Trading ↗
              </button>
            </Link>
          </div>
        )}
      </header>

      {/* ── 1. Hero Section ──────────────────────────────────────── */}
      <section
        style={{
          minHeight: isDesktop ? 'calc(100vh - 120px)' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '80px 24px 100px' : '60px 16px 60px',
        }}
      >
        <AnimatedLogo />

        {/* Built on ARC Pulsing Badge */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#ffffff',
            textTransform: 'uppercase',
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
          BUILT ON ARC
        </div>

        {/* Redesigned Serif Headline */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '38px' : isTablet ? '56px' : '72px',
            fontWeight: 400,
            lineHeight: 1.1,
            color: '#ffffff',
            margin: '0 0 20px',
            maxWidth: 950,
            letterSpacing: '-1.5px',
          }}
        >
          Trade the Next Minute of Crypto.
        </h1>

        {/* Updated Subtitle */}
        <p
          style={{
            fontSize: isMobile ? '15px' : isTablet ? '17px' : '19px',
            color: 'var(--text-secondary)',
            margin: '0 0 40px',
            maxWidth: 680,
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          The Pari-Mutuel AMM for High-Frequency Binary Decentralized Prediction Markets.
        </p>

        {/* Actions Button Row */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, width: isMobile ? '100%' : 'auto', justifyContent: 'center', alignItems: 'center', marginBottom: 48 }}>
          <Link href="/trade" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
            <button
              className="btn-up animate-glow-pulse"
              style={{
                width: isMobile ? '100%' : 'auto',
                padding: '16px 40px',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '1px',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)',
                background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
                color: '#000000',
              }}
            >
              Start Trading ↗
            </button>
          </Link>
          <a href="#markets" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
            <button
              style={{
                width: isMobile ? '100%' : 'auto',
                padding: '15px 36px',
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 12,
                cursor: 'pointer',
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              Explore Markets
            </button>
          </a>
        </div>

        {/* Minimal Sentiment Bar */}
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: 64,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 18px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <span>LIVE BTC FORECAST SENTIMENT:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>⚪ {sentiment}% UP</span>
          <span style={{ opacity: 0.2 }}>|</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>⚫ {100 - sentiment}% DOWN</span>
        </div>

        {/* Trust Badges Row */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: isMobile ? 12 : 24,
            opacity: 0.85
          }}
        >
          {[
            { label: 'Non-Custodial', icon: <KeyIcon size={14} /> },
            { label: 'Low Fees', icon: <DiamondIcon size={14} /> },
            { label: 'Fast Settlement', icon: <LightningIcon size={14} /> },
            { label: 'Built on Arc', icon: <GlobeIcon size={14} /> }
          ].map((badge, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                padding: '6px 14px',
                borderRadius: 20
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: '#ffffff', opacity: 0.8 }}>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Live Markets Preview ──────────────────────────────── */}
      <section
        id="markets"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Live Markets
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Real-time binary predictions currently active on the testnet.
            </p>
          </div>
        </ScrollFade>

        {/* Markets cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {[
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
          ].map((m, idx) => (
            <ScrollFade key={idx} delay={`${idx * 0.1}s`}>
              <div 
                className="feature-card"
                style={{ 
                  padding: 24, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 20, 
                  border: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.015)' 
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--up)' }} className="animate-pulse-live" />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{m.pair}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ID: {m.id}</span>
                </div>

                {/* Main Forecast Title */}
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{m.target}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Will price settle higher than current?</span>
                </div>

                {/* Probability bar distribution */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: '#ffffff' }}>YES {m.upPct}%</span>
                    <span style={{ color: 'var(--text-secondary)' }}>NO {100 - m.upPct}%</span>
                  </div>
                  {/* Visual ratio bar */}
                  <div style={{ height: 6, width: '100%', background: 'rgba(82, 82, 82, 0.2)', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${m.upPct}%`, background: '#ffffff', height: '100%' }} />
                    <div style={{ width: `${100 - m.upPct}%`, background: '#525252', height: '100%' }} />
                  </div>
                </div>

                {/* Vol / Time stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>VOLUME:</span>{' '}
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{m.vol}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>TIME LEFT:</span>{' '}
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{m.time}</strong>
                  </div>
                </div>

                {/* Trade Button */}
                <Link href="/trade" style={{ textDecoration: 'none', width: '100%' }}>
                  <button 
                    style={{ 
                      width: '100%', 
                      padding: '10px 0', 
                      borderRadius: 8, 
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    Place Prediction ↗
                  </button>
                </Link>
              </div>
            </ScrollFade>
          ))}
        </div>
      </section>

      {/* ── 3. Why DotMarket Feature Grid ────────────────────────── */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Why DotMarket?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Built for high-performance decentralized finance.
            </p>
          </div>
        </ScrollFade>

        {/* 8 Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { title: 'Non-Custodial', desc: 'Your assets always remain in your wallet.', icon: <KeyIcon size={24} /> },
            { title: 'Transparent Resolution', desc: 'Markets resolve using verifiable on-chain data.', icon: <ScaleIcon size={24} /> },
            { title: 'Fast Settlement', desc: 'Claim rewards immediately after market resolution.', icon: <LightningIcon size={24} /> },
            { title: 'Built on Arc', desc: 'Fast and low-cost infrastructure.', icon: <GlobeIcon size={24} /> },
            { title: 'Open Source Contracts', desc: 'Smart contracts are publicly auditable.', icon: <ScrollIcon size={24} /> },
            { title: 'Low Trading Fees', desc: 'More profits stay with traders.', icon: <DiamondIcon size={24} /> },
            { title: 'Lightning Fast', desc: 'Near-instant transaction confirmations.', icon: <TimerIcon size={24} /> },
            { title: 'Global Access', desc: 'Trade from anywhere with a crypto wallet.', icon: <GlobeIcon size={24} /> }
          ].map((f, idx) => (
            <ScrollFade key={idx} delay={`${idx * 0.05}s`}>
              <div className="feature-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', color: '#ffffff', opacity: 0.85 }}>{f.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </ScrollFade>
          ))}
        </div>
      </section>

      {/* ── 4. How It Works ──────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              How It Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Four simple steps to on-chain predictions.
            </p>
          </div>
        </ScrollFade>

        {/* Steps Flow Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr', gap: 32, position: 'relative' }}>
          {[
            { num: '01', title: 'Connect Wallet', desc: 'Securely authenticate your Web3 identity.', icon: <WalletIcon size={22} /> },
            { num: '02', title: 'Choose a Market', desc: 'Select crypto pairings or forecasting rounds.', icon: <ChartIcon size={22} /> },
            { num: '03', title: 'Predict YES or NO', desc: 'Secure your trade and deposit collateral.', icon: <TargetIcon size={22} /> },
            { num: '04', title: 'Claim Rewards', desc: 'Collect USDC automatically after resolution.', icon: <GiftIcon size={22} /> }
          ].map((s, idx) => (
            <ScrollFade key={idx} delay={`${idx * 0.1}s`}>
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  position: 'relative', 
                  padding: 24 
                }}
              >
                {/* Visual Connector Dot */}
                <div 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 20, 
                    marginBottom: 20,
                    boxShadow: '0 0 20px rgba(255,255,255,0.02)' 
                  }}
                >
                  {s.icon}
                </div>

                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>STEP {s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 220 }}>{s.desc}</p>
                
                {/* Horizontal flow connector helper */}
                {isDesktop && idx < 3 && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 48, 
                      left: 'calc(50% + 40px)', 
                      width: 'calc(100% - 80px)', 
                      height: 1, 
                      borderTop: '1px dashed rgba(255,255,255,0.1)', 
                      zIndex: 1 
                    }} 
                  />
                )}
              </div>
            </ScrollFade>
          ))}
        </div>
      </section>

      {/* ── 5. Why ARC? ──────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div 
            className="glass-card"
            style={{ 
              display: 'flex', 
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 48,
              padding: isDesktop ? '64px' : '32px 24px',
              background: 'rgba(255, 255, 255, 0.005)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: 24,
            }}
          >
            {/* Left text */}
            <div style={{ flex: isDesktop ? '1 1 500px' : '1 1 100%' }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: isMobile ? '32px' : '44px',
                  fontWeight: 400,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  margin: '0 0 20px',
                }}
              >
                Why ARC?
              </h2>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, margin: '0 0 32px' }}>
                dotMarket leverages the high-throughput architecture of ARC to offer speed and cost efficiency that are impossible on standard layer-1 chains.
              </p>

              {/* Bullet features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Near-Instant Finality', desc: 'Predict right up to the final second without transaction delays.' },
                  { title: 'Frictionless Low Fees', desc: 'Execute micro-predictions economically with minimal gas fees.' },
                  { title: 'Scalable Infrastructure', desc: 'Engineered to support thousands of parallel high-frequency pools.' },
                  { title: 'Developer-Friendly Ecosystem', desc: 'Integrated with top-tier oracles and cross-chain compatibility bridges.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>✓</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: '#ffffff' }}>{item.title}</strong>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right abstract logo/graphics panel */}
            <div style={{ flex: isDesktop ? '1 1 400px' : '1 1 100%', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: 400, 
                  aspectRatio: '1', 
                  borderRadius: '50%', 
                  background: 'radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Arc stylized vector mark */}
                <svg viewBox="0 0 100 100" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  {/* Elegant intersecting curves */}
                  <path d="M20 50 A30 30 0 0 1 80 50" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                  <path d="M20 50 A30 30 0 0 0 80 50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="50" cy="20" r="3" fill="#ffffff" />
                  <circle cx="50" cy="80" r="2" fill="#ffffff" opacity="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </ScrollFade>
      </section>

      {/* ── 6. Platform Statistics ───────────────────────────────── */}
      <section
        id="stats"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          background: 'rgba(255, 255, 255, 0.003)',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
            {[
              { label: 'Trading Volume', value: '42.8', suffix: 'M', prefix: '$' },
              { label: 'Markets Created', value: '12400', suffix: '+', prefix: '' },
              { label: 'Predictions Made', value: '1.6', suffix: 'M+', prefix: '' },
              { label: 'Active Traders', value: '45800', suffix: '+', prefix: '' },
              { label: 'Settlement Accuracy', value: '99.99', suffix: '%', prefix: '' },
              { label: 'Protocol Uptime', value: '99.99', suffix: '%', prefix: '' }
            ].map((stat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>{stat.label.toUpperCase()}</span>
                <strong style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 300, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {stat.prefix}
                  <AnimatedStat value={stat.value} />
                  {stat.suffix}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Security & Trust ──────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Security & Trust
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Pillars of security securing every transaction.
            </p>
          </div>
        </ScrollFade>

        {/* Security Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { title: 'Self-Custody', desc: 'Withdraw and trade without third-party custodianship.', icon: <ShieldIcon size={20} /> },
            { title: 'On-Chain Settlement', desc: 'Contract checks and price feeds settle fully on-chain.', icon: <LinkIcon size={20} /> },
            { title: 'Transparent Smart Contracts', desc: 'Auditable code bases verify pool settlements.', icon: <ScrollIcon size={20} /> },
            { title: 'Immutable Transactions', desc: 'No transaction can be rolled back or censored.', icon: <LockIcon size={20} /> },
            { title: 'Community Driven', desc: 'Fees and features flow back into pool liquidity.', icon: <UsersIcon size={20} /> },
            { title: 'Secure Infrastructure', desc: 'Redundant RPC structures block loop crashes.', icon: <DatabaseIcon size={20} /> }
          ].map((sec, idx) => (
            <ScrollFade key={idx} delay={`${idx * 0.05}s`}>
              <div 
                className="feature-card" 
                style={{ 
                  padding: 24, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.005)' 
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: '#ffffff', opacity: 0.85 }}>{sec.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{sec.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{sec.desc}</p>
              </div>
            </ScrollFade>
          ))}
        </div>
      </section>

      {/* ── 8. Roadmap ───────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Development Roadmap
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              The future of high-frequency prediction markets.
            </p>
          </div>
        </ScrollFade>

        {/* Roadmap horizontal timeline container */}
        <div className="roadmap-timeline-container">
          {[
            { phase: 'Q2', title: 'Protocol Launch', desc: 'Core smart contract pools deployed on testnet.' },
            { phase: 'Q3', title: 'Prediction Markets', desc: 'Launch multi-collateral and advanced metrics forecast pools.' },
            { phase: 'Q4', title: 'Mobile Trading', desc: 'Launch dedicated responsive mobile terminal app views.' },
            { phase: 'Future', title: 'Market Creation', desc: 'Allow user-created custom prediction pools.' },
            { phase: 'Future', title: 'DAO Governance', desc: 'Transition protocol mechanics to token voting structures.' },
            { phase: 'Future', title: 'Cross-Chain', desc: 'Deploy on Arbitrum, Base, and Solana via bridging protocols.' }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="glass-card"
              style={{
                flex: '0 0 240px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: 16
              }}
            >
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 8 }}>{item.phase}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. FAQ Accordion Section ────────────────────────────── */}
      <section
        id="faq"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px' : '60px 16px',
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '32px' : '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Clear answers to core mechanism details.
            </p>
          </div>
        </ScrollFade>

        {/* FAQ Accordion container */}
        <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.005)' }}>
          <FAQItem 
            question="What is dotMarket?" 
            answer="dotMarket is a decentralized, high-frequency prediction platform built on ARC. It allows users to place binary predictions (UP or DOWN) on asset prices with sub-minute resolutions using a pari-mutuel AMM structure." 
          />
          <FAQItem 
            question="How do prediction markets work?" 
            answer="Traders allocate collateral (USDC) into either the UP pool or the DOWN pool. When the prediction window locks, the ratio is set. Once the round resolves, the winning side takes the accumulated pool, split proportionally based on individual collateral contributions." 
          />
          <FAQItem 
            question="How are markets resolved?" 
            answer="Markets are settled on-chain via automated keeper bots that query real-time oracle price feeds (such as the Pyth Network Hermes feed). This ensures transparent, fast, and tamper-proof resolution." 
          />
          <FAQItem 
            question="Is dotMarket non-custodial?" 
            answer="Yes, completely. dotMarket is constructed of non-custodial smart contracts. All tokens remain in your personal Web3 wallet or in the locked smart contract escrow during active rounds, and can only be withdrawn by you." 
          />
          <FAQItem 
            question="Which wallets are supported?" 
            answer="Any Web3 EIP-1193 compatible wallet (like MetaMask, Coinbase Wallet, Rabby, or Rainbow) is supported through the standard wagmi connector suite." 
          />
          <FAQItem 
            question="Is KYC required?" 
            answer="No. dotMarket is a decentralized protocol. You only need to connect a compatible Web3 wallet and hold testnet gas (ETH/USDC) to begin trading." 
          />
          <FAQItem 
            question="What fees are charged?" 
            answer="dotMarket charges minimal protocol fees of 1-2% on winning payouts. These fees accumulate to fuel keeper gas buffers and support active community development rewards." 
          />
          <FAQItem 
            question="When is mobile trading coming?" 
            answer="Mobile-optimized terminal views are currently scheduled for release in Q4. However, you can currently view the landing page and read active stats from any mobile viewport." 
          />
        </div>
      </section>

      {/* ── 10. Final CTA ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: isDesktop ? '100px 24px 120px' : '60px 16px 80px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade>
          <div 
            className="glass-glow-panel"
            style={{ 
              borderRadius: 24, 
              padding: isDesktop ? '80px 48px' : '48px 24px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Glowing highlight */}
            <div 
              style={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
              }}
            />

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? '36px' : '52px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
                letterSpacing: '-1px'
              }}
            >
              Ready to Predict the Future?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, marginBottom: 40, lineHeight: 1.6 }}>
              Connect your wallet, explore active rounds, and join the high-frequency trading arena.
            </p>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
              <Link href="/trade" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                <button
                  className="btn-up"
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    padding: '16px 44px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                >
                  Start Trading
                </button>
              </Link>
              <a href="#markets" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                <button
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    padding: '15px 36px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  Explore Markets
                </button>
              </a>
            </div>
          </div>
        </ScrollFade>
      </section>

      {/* ── 11. Footer ───────────────────────────────────────────── */}
      <ScrollFade style={{ width: '100%' }}>
        <footer
          style={{
            position: 'relative',
            zIndex: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            padding: isDesktop ? '64px 24px 32px' : '48px 16px 24px',
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Top Multi-column grids */}
          <div 
            style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr 1.5fr' : '2fr 1fr 1fr 1fr',
              gap: 40,
              marginBottom: 48
            }}
          >
            {/* Brand Logo & Tag */}
            <div style={{ gridColumn: isMobile ? 'span 2' : 'span 1', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 200 60" width="130" height="39" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <mask id="footerLogoMask">
                      <rect x="0" y="0" width="200" height="60" fill="white" />
                      <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                    </mask>
                  </defs>
                  <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#footerLogoMask)" />
                  <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
                  <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
                  <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 220 }}>
                High-frequency binary decentralized prediction pools on ARC.
              </span>
            </div>

            {/* Product Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>PRODUCT</strong>
              {['Start Trading', 'Leaderboard', 'Portfolio'].map((link) => (
                <Link key={link} href="/trade" style={{ textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {link}
                </Link>
              ))}
            </div>

            {/* Documentation Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>RESOURCES</strong>
              {['Documentation', 'Brand Kit', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <a key={link} href="#" style={{ textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {link}
                </a>
              ))}
            </div>

            {/* Social Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>COMMUNITY</strong>
              {['X (Twitter)', 'Discord', 'Telegram', 'GitHub'].map((link) => (
                <a key={link} href="#" style={{ textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Copyright Status bar */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: isDesktop ? 'row' : 'column-reverse',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: 12,
              color: 'var(--text-muted)',
              gap: 16,
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              paddingTop: 24
            }}
          >
            <div>&copy; {new Date().getFullYear()} dotMarket. All rights reserved.</div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>dotMarket Testnet</span>
              <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--up)' }} />
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>Status: Active</span>
              </div>
            </div>
          </div>
        </footer>
      </ScrollFade>
    </div>
  );
}
