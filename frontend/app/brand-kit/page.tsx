'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Check, Download, AlertCircle, CheckCircle, 
  Mail, ArrowUpRight, ArrowLeft, Volume2, Move, LayoutGrid, Type, Palette, ShieldCheck, Heart, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Color Palette Definition
const COLORS = [
  { name: 'Core Black', hex: '#000000', use: 'Main background, deep contrast elements, primary theme.' },
  { name: 'Pure White', hex: '#FFFFFF', use: 'Primary headings, text, high-priority icons.' },
  { name: 'Studio Grey', hex: '#0A0A0A', use: 'Component cards, navigation container backgrounds.' },
  { name: 'Border Accent', hex: '#1F1F1F', use: 'Interactive element borders, subtle grid outlines.' },
  { name: 'Secondary Text', hex: '#8F8F8F', use: 'Paragraph body, descriptive labels, metadata.' },
  { name: 'Muted Contrast', hex: '#3E3E3E', use: 'Disabled buttons, secondary lines, dividers.' },
];

const SECTIONS = [
  { id: 'overview', title: 'Brand Overview', icon: <Volume2 size={16} /> },
  { id: 'mission', title: 'Mission & Vision', icon: <Heart size={16} /> },
  { id: 'logo', title: 'Logo System', icon: <ShieldCheck size={16} /> },
  { id: 'colors', title: 'Color Palette', icon: <Palette size={16} /> },
  { id: 'typography', title: 'Typography', icon: <Type size={16} /> },
  { id: 'iconography', title: 'Iconography', icon: <LayoutGrid size={16} /> },
  { id: 'components', title: 'UI Components', icon: <LayoutGrid size={16} /> },
  { id: 'motion', title: 'Motion Principles', icon: <Move size={16} /> },
  { id: 'voice', title: 'Voice & Messaging', icon: <Volume2 size={16} /> },
  { id: 'guidelines', title: 'Usage Guidelines', icon: <AlertCircle size={16} /> },
  { id: 'screenshots', title: 'Product Screenshots', icon: <ImageIcon size={16} /> },
  { id: 'downloads', title: 'Download Center', icon: <Download size={16} /> },
  { id: 'press', title: 'Press Kit', icon: <ImageIcon size={16} /> },
  { id: 'contact', title: 'Contact Support', icon: <Mail size={16} /> },
];

export default function BrandKitPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer to highlight side navigation automatically
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -60% 0px', // Trigger when section occupies screen center
      threshold: 0.1,
    });

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Offset for sticky docs header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Background Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.8
      }} />

      {/* Embedded CSS for Hover States */}
      <style>{`
        .nav-item {
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.03);
        }
        .nav-item.active {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06);
          border-left: 2px solid #ffffff;
        }
        .brand-card {
          background: #0A0A0A;
          border: 1px solid #1F1F1F;
          border-radius: 12px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .brand-card:hover {
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .color-card {
          position: relative;
          cursor: pointer;
        }
        .color-card .copy-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .color-card:hover .copy-btn {
          opacity: 1;
        }
        .docs-back-btn {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 32px;
          transition: color 0.2s ease;
        }
        .docs-back-btn:hover {
          color: #ffffff;
        }
        @media (max-width: 1024px) {
          .desktop-side-nav {
            display: none !important;
          }
          .brand-main-content {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>

      {/* Navigation Top Header */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 200 60" width="140" height="42" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="brandHeaderLogoMask">
                  <rect x="0" y="0" width="200" height="60" fill="white" />
                  <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                </mask>
              </defs>
              <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#brandHeaderLogoMask)" />
              <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
              <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
              <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
            </svg>
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Brand Assets</span>
        </div>
        <Link href="/docs/user-guide/introduction" style={{ fontSize: '13px', color: '#ffffff', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Documentation</span>
          <ArrowUpRight size={14} />
        </Link>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', paddingTop: '100px' }}>
        
        {/* Sticky Desktop Side Nav */}
        <div className="desktop-side-nav" style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: 'calc(100vh - 100px)',
          position: 'sticky',
          top: '100px',
          overflowY: 'auto',
          padding: '0 24px 32px 0'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '12px' }}>
            Brand System
          </h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => handleScrollToSection(section.id)}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {section.icon}
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Body */}
        <main className="brand-main-content" style={{ flex: 1, minWidth: 0, padding: '0 48px 120px 48px', maxWidth: '980px', zIndex: 1 }}>
          
          <Link href="/docs/user-guide/introduction" className="docs-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Docs</span>
          </Link>

          {/* Hero Header */}
          <div style={{ marginBottom: '64px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Design System & Brand Kit
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '680px' }}>
              The official styling guide and design specifications for DotMarket. Understand our visual elements, color hierarchy, and brand assets to build consistent interfaces.
            </p>
          </div>

          {/* 1. Brand Overview */}
          <section id="overview" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>1. Brand Overview</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '24px', fontSize: '15px' }}>
              DotMarket is a high-frequency, non-custodial prediction protocol configured specifically for short-term Bitcoin price direction. Our brand reflects absolute clarity, cryptographic accuracy, and dynamic speed. We combine the elegance of premium dark-mode aesthetics with the responsiveness of institutional trading tools.
            </p>
            <div className="brand-card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>视觉理念 (Visual Philosophy)</h4>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '14px' }}>
                We avoid distracting gradients, flashy colors, and unorganized elements. The DotMarket interface relies on a monochrome canvas, pristine typography, glassmorphism layers, and subtle micro-animations that make the platform feel responsive and alive.
              </p>
            </div>
          </section>

          {/* 2. Mission & Vision */}
          <section id="mission" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>2. Mission & Vision</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div className="brand-card" style={{ padding: '32px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Mission</span>
                <h3 style={{ fontSize: '20px', fontWeight: 400, margin: '16px 0 12px' }}>Simplifying price dynamics</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '14px' }}>
                  To provide a trustless, dynamic venue for short-term direction trading. We strip away the complexity of traditional margin accounts, funding structures, and leverage constraints, offering direct direction-only on-chain predictions.
                </p>
              </div>
              <div className="brand-card" style={{ padding: '32px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Vision</span>
                <h3 style={{ fontSize: '20px', fontWeight: 400, margin: '16px 0 12px' }}>On-chain precision</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '14px' }}>
                  Building the most transparent, liquid, and fast-paced prediction protocol in decentralized finance, powered by verified on-chain oracle infrastructure and trustless settlement models.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Logo System */}
          <section id="logo" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>3. Logo System</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              Our logo represents a balanced structure: the solid circle represents the target pool boundary, the diagonal line indicates split sentiment, and the inner point represents settlement accuracy.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', minHeight: '180px' }}>
                <svg viewBox="0 0 200 60" width="160" height="48" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <mask id="brandGuideMask">
                      <rect x="0" y="0" width="200" height="60" fill="white" />
                      <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                    </mask>
                  </defs>
                  <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#brandGuideMask)" />
                  <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" />
                  <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
                  <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
                </svg>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Logo (Light Theme/Dark BG)</span>
              </div>

              <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', minHeight: '180px' }}>
                <svg viewBox="0 0 60 60" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <mask id="brandMarkMask">
                      <rect x="0" y="0" width="60" height="60" fill="white" />
                      <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                    </mask>
                  </defs>
                  <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#brandMarkMask)" />
                  <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" />
                </svg>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Icon Mark Only</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
              <div style={{ borderLeft: '2px solid #22c55e', paddingLeft: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Do</span>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Ensure the SVG mark is always rendered with high contrast against the background (e.g. pure white mark on deep black canvas). Keep a minimum clear margin spacing of 24px around the entire mark boundaries.
                </p>
              </div>
              <div style={{ borderLeft: '2px solid #ef4444', paddingLeft: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Don't</span>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Do not stretch, distort, alter layout proportions, or introduce accent gradients/colors to the logomark or typography.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Color Palette */}
          <section id="colors" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '12px' }}>4. Color Palette</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              We stick strictly to a monochrome palette. Click on any color block below to copy its HEX code instantly to your clipboard.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {COLORS.map((color) => (
                <div 
                  key={color.hex}
                  onClick={() => handleCopyColor(color.hex)}
                  className="brand-card color-card"
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{ height: '80px', background: color.hex, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{color.name}</span>
                      <button className="copy-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                        {copiedColor === color.hex ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>{color.hex}</span>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: 1.4, height: '40px', overflow: 'hidden' }}>
                      {color.use}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Typography */}
          <section id="typography" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>5. Typography</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              Our type system relies on two font families to establish hierarchy: **Cormorant Garamond** for editorial hero titles and **Inter** for all interface structures, numbers, and descriptive body text.
            </p>
            <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hero Typestyle (Cormorant Garamond)</span>
                <h1 style={{ fontSize: '36px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: '12px 0 8px' }}>
                  The 1-Minute Prediction Engine
                </h1>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Used exclusively for landing page hero headings and large documentation headings.</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interface Typestyle (Inter)</span>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: '12px 0 8px' }}>
                  All UI elements, panel tabs, transaction details, active positions, and numerical tickers utilize the Inter sans-serif typeface to ensure crisp readability down to small font sizes.
                </p>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Used for interface, labels, tables, code outputs, and body content.</span>
              </div>
            </div>
          </section>

          {/* 6. Iconography */}
          <section id="iconography" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>6. Iconography</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              We use line-style icons with consistent stroke weights (`1.5px` or `2px`) and square endpoints. Icons must always be presented in monochrome tints matching the surrounding typography.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Security Checks</span>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  <Palette size={24} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Palette Control</span>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  <Move size={24} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Motion Systems</span>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={24} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Grid Layouts</span>
              </div>
            </div>
          </section>

          {/* 7. UI Components */}
          <section id="components" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>7. UI Components</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              We build interfaces using modular, reusable components styled with custom CSS properties. Our buttons, badges, and cards feature a glassmorphic look with clear hover responses.
            </p>
            <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Button Specs</h4>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Action</Button>
                </div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Badge Specs</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.05em' }}>DEFAULT BADGE</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.05em' }}>ACTIVE BADGE</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.05em' }}>WARNING BADGE</span>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Motion Principles */}
          <section id="motion" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>8. Motion Principles</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              Motion is used to emphasize interface responses and active states. We do not use bouncy or aggressive spring physics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="brand-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>1. Easing Curves</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  All element transitions (like card hover border changes or dropdown entries) must use the custom easing cubic curve: `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo). This makes movements feel immediate but highly fluid.
                </p>
              </div>
              <div className="brand-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>2. Transition Duration</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  UI shifts should remain short and tight. Standard hover actions must complete within `200ms` to `300ms` max to avoid making the interface feel sluggish.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Brand Voice & Messaging */}
          <section id="voice" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>9. Brand Voice & Messaging</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              We write content with a technical, direct, and authoritative voice. We avoid gamified terminology and hype-focused phrases.
            </p>
            <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Tone Principle</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  We present statistics, timelines, and mechanics neutrally. The user is a participant or trader, not a gambler.
                </p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Vocabulary Alignment</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '8px', color: '#22c55e' }}>USE THIS</th>
                      <th style={{ textAlign: 'left', paddingBottom: '8px', color: '#ef4444' }}>AVOID THIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 0' }}>Prediction, Predict UP/DOWN</td>
                      <td style={{ padding: '8px 0' }}>Bet, Betting, Wager</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 0' }}>Participant, Analyst, Trader</td>
                      <td style={{ padding: '8px 0' }}>Bettor, Player, Gambler</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 0' }}>Pari-mutuel Pool multiplier</td>
                      <td style={{ padding: '8px 0' }}>Odds, Betting odds, Bookmaker cut</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 10. Usage Guidelines */}
          <section id="guidelines" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>10. Usage Guidelines</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="brand-card" style={{ padding: '32px', borderLeft: '3px solid #22c55e' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand DOs</span>
                <ul style={{ paddingLeft: '20px', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Apply clean borders (`1px solid rgba(255,255,255,0.05)`) to divide contents.</li>
                  <li>Verify that typography follows the hierarchy (Garamond vs Inter).</li>
                  <li>Use micro-animations with strict durations under 300ms.</li>
                </ul>
              </div>
              <div className="brand-card" style={{ padding: '32px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand DONTs</span>
                <ul style={{ paddingLeft: '20px', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Do not use gradient text or non-monochrome styling.</li>
                  <li>Do not introduce bright, heavy background blocks for headers.</li>
                  <li>Do not change layouts to unaligned grids.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 11. Product Screenshots */}
          <section id="screenshots" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>11. Product Screenshots</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              Standard product screenshots for media publication. Ensure images are not cropped or modified.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="brand-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '160px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={32} style={{ opacity: 0.3 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Trading Console Mockup</span>
                  <a href="#" style={{ color: 'rgba(255,255,255,0.4)' }}><Download size={16} /></a>
                </div>
              </div>
              <div className="brand-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '160px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={32} style={{ opacity: 0.3 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Round Positions</span>
                  <a href="#" style={{ color: 'rgba(255,255,255,0.4)' }}><Download size={16} /></a>
                </div>
              </div>
            </div>
          </section>

          {/* 12. Download Center */}
          <section id="downloads" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>12. Download Center</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Logo Assets (SVG)</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Official dotMarket vector logo files for dark and light backgrounds.</p>
                <Button variant="secondary" style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={14} />
                  <span>Download SVG</span>
                </Button>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Typography Kit</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>TrueType and OpenType fonts package for design compilation.</p>
                <Button variant="secondary" style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={14} />
                  <span>Download Fonts</span>
                </Button>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Press Assets Bundle</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>High resolution raster images, team photos, and brand profile.</p>
                <Button variant="secondary" style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={14} />
                  <span>Download ZIP</span>
                </Button>
              </div>
            </div>
          </section>

          {/* 13. Press Kit */}
          <section id="press" style={{ marginBottom: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>13. Press Kit</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '24px', fontSize: '15px' }}>
              Media kit materials for writers and journalists. Get official copy descriptions, system features list, and press release templates.
            </p>
            <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Copy Description</span>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                "DotMarket is a non-custodial decentralized prediction market deployed on the Arc Testnet. The platform supportsrolling 1-minute Bitcoin direction predictions resolved via the Pyth Oracle network, combining absolute on-chain settlement transparently with institutional visual elements."
              </p>
            </div>
          </section>

          {/* 14. Contact */}
          <section id="contact" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>14. Contact Support</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
              If you have custom visual needs, media queries, or developer integrations, contact our branding team.
            </p>
            <div className="brand-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>branding@dotmarket.space</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Standard response turnaround is 24-48 business hours.</p>
              </div>
              <a href="mailto:branding@dotmarket.space" style={{ textDecoration: 'none', marginTop: '12px' }}>
                <Button variant="primary">Send Email</Button>
              </a>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
