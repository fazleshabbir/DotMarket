'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { StarryBackground } from '@/components/StarryBackground';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { ScrollFade } from '@/components/ScrollFade';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMotionSystem } from '@/hooks/useMotionSystem';

// Lazy load below-the-fold sections to optimize initial bundle size & performance
const HowItWorksSection = dynamic(() => import('@/components/HowItWorksSection').then(m => m.HowItWorksSection), { ssr: false });
const CommunitySection = dynamic(() => import('@/components/CommunitySection').then(m => m.CommunitySection), { ssr: false });
const RoadmapSection = dynamic(() => import('@/components/roadmap/RoadmapSection').then(m => m.RoadmapSection), { ssr: false });
const LiveMarketsSection = dynamic(() => import('@/components/LiveMarketsSection').then(m => m.LiveMarketsSection), { ssr: false });

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
  const {
    revealHeading,
    revealSubtitle,
    revealCard,
    revealButton,
    staggerContainer,
    staggerItem,
    fadeIn,
    fadeUp,
    shouldReduceMotion,
  } = useMotionSystem();

  const [sentiment, setSentiment] = useState(54);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200); // Default to desktop layout
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#ffffff', background: '#000000', overflowX: 'clip', width: '100%', maxWidth: '100%' }}>
      
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
            {['Markets', 'How It Works', 'FAQ', 'Docs'].map((tab) => (
              <Link
                key={tab}
                href={tab === 'Docs' ? '/docs/user-guide/introduction' : `#${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className="premium-text-link"
              >
                {tab}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        {isDesktop ? (
          <Link href="/trade" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">
              Start Trading
            </Button>
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
            {['Markets', 'How It Works', 'FAQ', 'Docs'].map((tab) => (
              <Link
                key={tab}
                href={tab === 'Docs' ? '/docs/user-guide/introduction' : `#${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className="premium-text-link"
                style={{ fontSize: 18, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}
                onClick={() => setMenuOpen(false)}
              >
                {tab}
              </Link>
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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <motion.div variants={fadeIn}>
            <AnimatedLogo />
          </motion.div>

          {/* Redesigned Serif Headline */}
          <motion.h1
            variants={revealHeading}
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
          </motion.h1>

          {/* Updated Subtitle */}
          <motion.p
            variants={revealSubtitle}
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
          </motion.p>

          {/* Actions Button Row */}
          <motion.div 
            variants={revealButton}
            style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, width: isMobile ? '100%' : 'auto', justifyContent: 'center', alignItems: 'center', marginBottom: 48 }}
          >
          <Link href="/trade" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
            <Button variant="primary" size="lg" showArrow={true} arrowDirection="up-right" style={{ width: isMobile ? '100%' : 'auto' }}>
              Start Trading
            </Button>
          </Link>
          <a href="#markets" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
            <Button variant="secondary" size="lg" showArrow={true} style={{ width: isMobile ? '100%' : 'auto' }}>
              Explore Markets
            </Button>
          </a>
          </motion.div>

          {/* Minimal Sentiment Bar */}
          <motion.div
            variants={staggerItem}
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
          </motion.div>

          {/* Trust Badges Row */}
          <motion.div 
            variants={staggerContainer(0.08)}
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
              { label: 'Multi-Chain', icon: <GlobeIcon size={14} /> }
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
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
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── 2. Live Markets Preview ──────────────────────────────── */}
      <LiveMarketsSection />


      {/* ── 4. How It Works ──────────────────────────────────────── */}
      <HowItWorksSection />


      {/* ── 8. Roadmap ───────────────────────────────────────────── */}
      <RoadmapSection />

      {/* ── 10. Community Section ────────────────────────────────────────────── */}
      <CommunitySection />

      {/* ── 9. FAQ Accordion Section ────────────────────────────── */}
      <Section id="faq" maxWidth={800}>
        <PageHeader
          title="Frequently Asked Questions"
          subtitle="Clear answers to core mechanism details."
        />

        {/* FAQ Accordion container */}
        <Card hoverEffect={false} style={{ overflow: 'hidden', padding: 0 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer(0.08)}
          >
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="What is dotMarket?" 
                answer="dotMarket is a decentralized, high-frequency prediction platform. It allows users to place binary predictions (UP or DOWN) on asset prices with sub-minute resolutions using a pari-mutuel AMM structure." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="How do prediction markets work?" 
                answer="Traders allocate collateral (USDC) into either the UP pool or the DOWN pool. When the prediction window locks, the ratio is set. Once the round resolves, the winning side takes the accumulated pool, split proportionally based on individual collateral contributions." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="How are markets resolved?" 
                answer="Markets are settled on-chain via automated keeper bots that query real-time oracle price feeds (such as the Pyth Network Hermes feed). This ensures transparent, fast, and tamper-proof resolution." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="Is dotMarket non-custodial?" 
                answer="Yes, completely. dotMarket is constructed of non-custodial smart contracts. All tokens remain in your personal Web3 wallet or in the locked smart contract escrow during active rounds, and can only be withdrawn by you." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="Which wallets are supported?" 
                answer="Any Web3 EIP-1193 compatible wallet (like MetaMask, Coinbase Wallet, Rabby, or Rainbow) is supported through the standard wagmi connector suite." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="Is KYC required?" 
                answer="No. dotMarket is a decentralized protocol. You only need to connect a compatible Web3 wallet and hold testnet gas (ETH/USDC) to begin trading." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="What fees are charged?" 
                answer="dotMarket charges minimal protocol fees of 1-2% on winning payouts. These fees accumulate to fuel keeper gas buffers and support active community development rewards." 
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FAQItem 
                question="When is mobile trading coming?" 
                answer="Mobile-optimized terminal views are currently scheduled for release in Q4. However, you can currently view the landing page and read active stats from any mobile viewport." 
              />
            </motion.div>
          </motion.div>
        </Card>
      </Section>

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
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr 1.5fr' : '2fr 1fr 1fr 1fr 1fr',
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
                High-frequency binary decentralized prediction pools.
              </span>
            </div>

            {/* Product Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>PRODUCT</strong>
              <Link href="/trade" className="premium-text-link">Trade</Link>
              <Link href="/docs/user-guide/introduction" className="premium-text-link">Documentation</Link>
              <a href="#roadmap" className="premium-text-link">Roadmap</a>
            </div>

            {/* Developers Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>DEVELOPERS</strong>
              <Link href="/docs/developers/api-reference" className="premium-text-link">API</Link>
              <Link href="/docs/developers/smart-contracts" className="premium-text-link">Smart Contracts</Link>
              <Link href="/brand-kit" className="premium-text-link">Brand Kit</Link>
            </div>

            {/* Resources Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>RESOURCES</strong>
              <Link href="/docs/community/faq" className="premium-text-link">FAQ</Link>
              <Link href="/docs/protocol/security" className="premium-text-link">Security</Link>
              <Link href="/docs/community/changelog-roadmap" className="premium-text-link">Changelog</Link>
            </div>

            {/* Community Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 13, color: '#ffffff', letterSpacing: '0.5px' }}>COMMUNITY</strong>
              <a href="https://discord.gg/SGCjXsgdY" target="_blank" rel="noopener noreferrer" className="premium-text-link">Discord</a>
              <a href="https://x.com/dotmarketai" target="_blank" rel="noopener noreferrer" className="premium-text-link">X</a>
              <a href="https://github.com/fazleshabbir/DotMarket" target="_blank" rel="noopener noreferrer" className="premium-text-link">GitHub</a>
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
