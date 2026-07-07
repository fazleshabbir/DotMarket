'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StarryBackground } from '@/components/StarryBackground';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { ScrollFade } from '@/components/ScrollFade';

export default function LandingPage() {
  const [sentiment, setSentiment] = useState(54);

  useEffect(() => {
    const interval = setInterval(() => {
      setSentiment((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(35, Math.min(65, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#ffffff', background: '#000000' }}>
      {/* Starry Canvas Background */}
      <StarryBackground />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          margin: '24px 24px 0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 200 60" width="160" height="48" xmlns="http://www.w3.org/2000/svg">
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

        {/* Center Nav capsule */}
        <nav
          style={{
            display: 'flex',
            gap: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 24,
            padding: '6px 20px',
            alignItems: 'center',
          }}
        >
          {['Docs', 'Community', 'Articles'].map((tab) => (
            <a
              key={tab}
              href={tab === 'Community' ? '#ecosystem' : '#'}
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

        {/* Right Action */}
        <Link href="/trade" style={{ textDecoration: 'none' }}>
          <button
            className="glass-card"
            style={{
              padding: '8px 20px',
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
            Trade Now
          </button>
        </Link>
      </header>

      {/* ── 1. Hero Section (Full Viewport) ────────────────────────── */}
      <section
        style={{
          minHeight: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '0 24px 80px',
        }}
      >
        {/* Animated dotMarket Brand Mark */}
        <AnimatedLogo />

        {/* Hero Badge */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '2px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginBottom: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
          Built on ARC
        </div>

        {/* Serif Headline */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'min(7.5vw, 68px)',
            fontWeight: 400,
            lineHeight: 1.1,
            color: '#ffffff',
            margin: '0 0 20px',
            maxWidth: 900,
            letterSpacing: '-1px',
          }}
        >
          Trade the Next Minute of Crypto
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'min(4.5vw, 18px)',
            color: 'var(--text-secondary)',
            margin: '0 0 24px',
            maxWidth: 600,
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          The Pari-Mutuel AMM for High-Frequency Binary Markets.
        </p>

        {/* Minimal Sentiment Indicator */}
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <span>Sentiment:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>⚪ {sentiment}% UP</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>⚫ {100 - sentiment}% DOWN</span>
        </div>

        {/* Trade Now CTA with Glow */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              filter: 'blur(10px)',
              pointerEvents: 'none',
            }}
          />
          <Link href="/trade" style={{ textDecoration: 'none' }}>
            <button
              className="btn-up animate-glow-pulse"
              style={{
                padding: '16px 44px',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '1.5px',
                boxShadow: '0 0 30px rgba(255,255,255,0.2)',
                background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)',
                color: '#000000',
              }}
            >
              Trade Now ↗
            </button>
          </Link>
        </div>

        {/* Central Social Bars */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 20, 
            marginTop: 48, 
            color: 'var(--text-secondary)',
            zIndex: 10,
          }}
        >
          {/* X / Twitter */}
          <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Telegram */}
          <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.9 2.1L2.1 9.7c-1.3.5-1.3 1.3-.2 1.6l5.1 1.6 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.8L23.9 4c.3-1.4-.5-2-1.4-1.9z" />
            </svg>
          </a>

          <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Docs */}
          <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </a>
        </div>

        {/* Scroll Indicator */}
        <div style={{ position: 'absolute', bottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.5 }}>
          <span style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Protocol Mechanics</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── 2. Protocol Mechanics Section ─────────────────────────── */}
      <section
        id="mechanics"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '100px 24px',
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
                fontSize: 'min(6vw, 42px)',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 16,
              }}
            >
              Protocol Mechanics
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Inside dotMarket's high-frequency prediction lifecycle.
            </p>
          </div>
        </ScrollFade>

        {/* 3 Step Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Step 1 */}
          <ScrollFade delay="0.1s" style={{ height: '100%' }}>
            <div className="mechanic-card" style={{ height: '100%' }}>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>01 / POOLING</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>Dynamic Collateral Pools</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Secure a stance (UP or DOWN). Winnings scale dynamically based on pool participant ratios.
              </p>
            </div>
          </ScrollFade>

          {/* Step 2 */}
          <ScrollFade delay="0.2s" style={{ height: '100%' }}>
            <div className="mechanic-card" style={{ height: '100%' }}>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>02 / SECURITY</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>Arbitrage Shielding</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Pool locks 10 seconds before round start. Prevents late-stage arbitrage and front-running.
              </p>
            </div>
          </ScrollFade>

          {/* Step 3 */}
          <ScrollFade delay="0.3s" style={{ height: '100%' }}>
            <div className="mechanic-card" style={{ height: '100%' }}>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>03 / SETTLEMENT</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>Pari-Mutuel Settlements</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Keeper settles price feeds on-chain. Winner takes all pooled funds.
              </p>
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* ── 3. Ecosystem / Community Section (Split Layout) ───────── */}
      <section
        id="ecosystem"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px 100px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <ScrollFade delay="0.2s" style={{ width: '100%' }}>
          <div 
            className="glass-card"
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 48,
            padding: '60px 48px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 24,
          }}
        >
          {/* Left Column (Text & Buttons) */}
          <div style={{ flex: '1 1 500px' }}>
            {/* dotMarket Inner Dot logo mark */}
            <div style={{ marginBottom: 24 }}>
              <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="communityLogoMask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <circle cx="72.5" cy="72.5" r="14" fill="black" />
                  </mask>
                </defs>
                <circle cx="50" cy="50" r="50" fill="#ffffff" mask="url(#communityLogoMask)" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'min(7.5vw, 44px)',
                fontWeight: 400,
                color: '#ffffff',
                lineHeight: 1.2,
                margin: '0 0 16px',
              }}
            >
              Join our community
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, margin: '0 0 32px', maxWidth: 450 }}>
              Sub-Minute Resolution. Pure On-Chain Liquidity. Powered by Pyth.
            </p>

            {/* Custom styled Discord button with halo glow */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                }}
              />
              <a href="#" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '12px 28px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: '#09090b',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.background = '#09090b';
                  }}
                >
                  Join Discord ↗
                </button>
              </a>
            </div>

            {/* Small Line Drawing Social Links */}
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Twitter/X Link */}
              <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Telegram Link */}
              <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.9 2.1L2.1 9.7c-1.3.5-1.3 1.3-.2 1.6l5.1 1.6 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.8L23.9 4c.3-1.4-.5-2-1.4-1.9z" />
                </svg>
              </a>

              {/* Documents Link */}
              <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column (Hatched Vector Mountain Artwork) */}
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
              <svg viewBox="0 0 500 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', background: '#050505' }}>
                <defs>
                  {/* Hatching patterns for engraving look */}
                  <pattern id="hatch-1" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  </pattern>
                  <pattern id="hatch-2" width="6" height="6" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                  </pattern>
                  <linearGradient id="skyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
                    <stop offset="100%" stop-color="rgba(0,0,0,0)" />
                  </linearGradient>
                </defs>

                {/* Sky background */}
                <rect width="500" height="300" fill="url(#skyGlow)" />

                {/* Constellation lines */}
                <line x1="120" y1="60" x2="200" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" strokeDasharray="3 3" />
                <line x1="200" y1="90" x2="280" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" strokeDasharray="3 3" />
                <circle cx="120" cy="60" r="1.5" fill="#ffffff" />
                <circle cx="200" cy="90" r="2" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }} />
                <circle cx="280" cy="40" r="1.5" fill="#ffffff" />

                {/* Twinkles */}
                <circle cx="80" cy="110" r="0.8" fill="#ffffff" opacity="0.6" />
                <circle cx="340" cy="70" r="1" fill="#ffffff" opacity="0.8" />
                <circle cx="420" cy="140" r="0.6" fill="#ffffff" opacity="0.4" />

                {/* Mountain 3 (Back) */}
                <path d="M 120 300 L 280 120 L 440 300 Z" fill="url(#hatch-2)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                
                {/* Mountain 2 (Middle) */}
                <path d="M 40 300 L 210 80 L 380 300 Z" fill="#050505" />
                <path d="M 40 300 L 210 80 L 380 300 Z" fill="url(#hatch-1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />

                {/* Mountain 1 (Front) */}
                <path d="M 180 300 L 340 150 L 500 300 Z" fill="#000000" />
                <path d="M 180 300 L 340 150 L 500 300 Z" fill="url(#hatch-2)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </ScrollFade>
    </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <ScrollFade style={{ width: '100%' }}>
        <footer
          style={{
            position: 'relative',
            zIndex: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '48px 24px 32px',
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
          }}
        >
        {/* Top half */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          {/* Logo */}
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

          {/* Social Row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Twitter/X */}
            <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Telegram */}
            <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.9 2.1L2.1 9.7c-1.3.5-1.3 1.3-.2 1.6l5.1 1.6 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.8L23.9 4c.3-1.4-.5-2-1.4-1.9z" />
              </svg>
            </a>
            {/* Discord */}
            <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.27 4.73a16.14 16.14 0 0 0-3.97-1.23.08.08 0 0 0-.08.04 11.23 11.23 0 0 0-.5 1.02 14.88 14.88 0 0 0-4.44 0 11.3 11.3 0 0 0-.51-1.02.08.08 0 0 0-.08-.04 16.1 16.1 0 0 0-3.97 1.23.08.08 0 0 0-.03.03 16.17 16.17 0 0 0-3.1 11.75.09.09 0 0 0 .04.06 16.24 16.24 0 0 0 4.9 2.48.08.08 0 0 0 .09-.03c.38-.52.72-1.07 1-1.65a.08.08 0 0 0-.04-.11 10.63 10.63 0 0 1-1.5-.72.08.08 0 0 1-.01-.13 7.8 7.8 0 0 0 .3-.23.08.08 0 0 1 .08-.01c3.1 1.42 6.46 1.42 9.5 0a.08.08 0 0 1 .08.01c.1.08.2.16.3.24a.08.08 0 0 1-.01.13 10.84 10.84 0 0 1-1.5.72.08.08 0 0 0-.04.11c.29.58.63 1.13 1 1.65a.08.08 0 0 0 .09.03 16.18 16.18 0 0 0 4.9-2.48.08.08 0 0 0 .04-.06 16.17 16.17 0 0 0-3.07-11.75.08.08 0 0 0-.06-.03zM8.97 12.18c-.96 0-1.75-.88-1.75-1.97s.77-1.98 1.75-1.98c.99 0 1.77.89 1.75 1.98 0 1.09-.77 1.97-1.75 1.97zm6.06 0c-.96 0-1.75-.88-1.75-1.97s.77-1.98 1.75-1.98c.99 0 1.77.89 1.75 1.98 0 1.09-.77 1.97-1.75 1.97z" />
              </svg>
            </a>
            {/* Gitbook / Docs */}
            <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom half (Copyright + status) */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontSize: 12,
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>&copy; {new Date().getFullYear()} dotMarket. All rights reserved.</div>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>dotMarket Testnet</span>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--up)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>Status: Active</span>
            </div>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Brand Kit</span>
          </div>
        </div>
      </footer>
    </ScrollFade>
  </div>
  );
}
