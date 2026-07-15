'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowUp, Shield, AlertTriangle, EyeOff, Info, 
  ChevronDown, Globe, Key, FileText, CheckCircle2, Mail, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PolicySection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: PolicySection[] = [
  { id: 'introduction', title: '1. Protocol & Interface Nature', icon: <Info size={14} /> },
  { id: 'nokyc', title: '2. Zero KYC & Personal Data Policy', icon: <EyeOff size={14} /> },
  { id: 'geoblock', title: '3. Geo-Location & Compliance', icon: <Globe size={14} /> },
  { id: 'wallet', title: '4. Non-Custodial Interactions', icon: <Key size={14} /> },
  { id: 'blockchain', title: '5. Blockchain Immutability & GDPR', icon: <Globe size={14} /> },
  { id: 'collect', title: '6. Technical Telemetry We Collect', icon: <FileText size={14} /> },
  { id: 'cookies', title: '7. Cookies & Local Storage', icon: <EyeOff size={14} /> },
  { id: 'thirdparty', title: '8. Third-Party Web3 Integrations', icon: <ExternalLink size={14} /> },
  { id: 'security', title: '9. Infrastructure Security', icon: <Shield size={14} /> },
  { id: 'rights', title: '10. Your Rights', icon: <FileText size={14} /> },
  { id: 'children', title: '11. Age Restrictions', icon: <AlertTriangle size={14} /> },
  { id: 'updates', title: '12. Policy Revisions', icon: <Info size={14} /> },
  { id: 'contact', title: '13. Contact & Support', icon: <Mail size={14} /> },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Monitor scroll for progress bar and back-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      rootMargin: '-20% 0px -60% 0px',
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

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90; // Offset for header + progress
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setMobileMenuOpen(false);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ── Reading Progress Bar ───────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '3px',
        background: '#ffffff',
        zIndex: 110,
        transition: 'width 0.1s ease-out'
      }} />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.8
      }} />

      {/* Embedded CSS for Hover States & Responsiveness */}
      <style>{`
        .privacy-nav-item {
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .privacy-nav-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.03);
        }
        .privacy-nav-item.active {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06);
          border-left: 2px solid #ffffff;
        }
        .privacy-card {
          background: #0A0A0A;
          border: 1px solid #1F1F1F;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 32px;
          transition: border-color 0.3s ease;
        }
        .privacy-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .callout-box {
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          display: flex;
          gap: 16px;
          font-size: 14px;
          line-height: 1.6;
        }
        .callout-info {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
        }
        .callout-warning {
          background: rgba(239, 68, 68, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: rgba(255, 255, 255, 0.85);
        }
        .list-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-left: 20px;
          margin: 20px 0;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
        }
        @media (max-width: 1024px) {
          .privacy-side-nav {
            display: none !important;
          }
          .privacy-content-main {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .mobile-accordion-nav {
            display: block !important;
          }
        }
      `}</style>

      {/* Sticky Navbar */}
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
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 200 60" width="140" height="42" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="privacyHeaderLogoMask">
                  <rect x="0" y="0" width="200" height="60" fill="white" />
                  <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                </mask>
              </defs>
              <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#privacyHeaderLogoMask)" />
              <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
              <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
              <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
            </svg>
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Legal</span>
        </div>
        <Link href="/docs/user-guide/introduction" style={{ fontSize: '13px', color: '#ffffff', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Documentation</span>
          <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
        </Link>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', paddingTop: '100px' }}>
        
        {/* Sticky Sidebar Navigation (Desktop) */}
        <div className="privacy-side-nav" style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: 'calc(100vh - 100px)',
          position: 'sticky',
          top: '100px',
          overflowY: 'auto',
          padding: '0 24px 32px 0',
          background: 'transparent'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '12px' }}>
            Policy Outline
          </h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => handleScrollToSection(section.id)}
                className={`privacy-nav-item ${activeSection === section.id ? 'active' : ''}`}
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

        {/* Main Content Area */}
        <main className="privacy-content-main" style={{ flex: 1, minWidth: 0, padding: '0 48px 120px 48px', maxWidth: '980px', zIndex: 1 }}>
          
          <Link href="/docs/user-guide/introduction" className="docs-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Docs</span>
          </Link>

          {/* Hero Section */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '6px 12px', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)' }}>
                Web3 Privacy Policy
              </span>
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '680px', marginBottom: '32px' }}>
              This policy explains how DotMarket processes public blockchain states, geo-routing metadata, and network logs while maintaining a decentralized prediction system.
            </p>

            {/* Quick Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effective Date</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>July 16, 2026</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Reading Time</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>5 Minutes</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Status</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>Fully Non-Custodial</div>
              </div>
            </div>
          </div>

          {/* Mobile Accordion Navigation */}
          <div className="mobile-accordion-nav" style={{ display: 'none', marginBottom: '32px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: '100%',
                background: '#0A0A0A',
                border: '1px solid #1F1F1F',
                borderRadius: '8px',
                padding: '16px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <span>Jump to Section</span>
              <ChevronDown size={16} style={{ transform: mobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', background: '#050505', border: '1px solid #1F1F1F', borderTop: 'none', borderRadius: '0 0 8px 8px' }}
                >
                  <div style={{ padding: '8px' }}>
                    {SECTIONS.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleScrollToSection(section.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          color: activeSection === section.id ? '#ffffff' : 'rgba(255,255,255,0.6)',
                          padding: '10px 16px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {section.icon}
                        {section.title}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Privacy Policy Content ────────────────────────────── */}

          {/* 1. Protocol & Interface Nature */}
          <section id="introduction" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>1. Protocol & Interface Nature</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              Unlike centralized prediction books, DotMarket consists of two distinct components:
            </p>
            <ul className="list-items" style={{ margin: '0 0 16px' }}>
              <li><strong>The Protocol:</strong> An open-source, autonomous smart contract system deployed directly to public blockchain networks (the Arc Testnet).</li>
              <li><strong>The Interface:</strong> A client-side, web-based portal (accessible via this website) that translates blockchain data into a readable layout.</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              Your interactions with the DotMarket Protocol are direct, cryptographic, and trustless. We do not host prediction pools, set payouts, or manage ledger balances inside private databases.
            </p>
          </section>

          {/* 2. Zero KYC & Personal Data Policy */}
          <section id="nokyc" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>2. Zero KYC & Personal Data Policy</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              DotMarket is built upon Web3 principles of cryptographic identity. We do not require, collect, or store any of the following traditional personal identifiable information (PII):
            </p>
            <ul className="list-items" style={{ margin: '0 0 16px' }}>
              <li>Names, physical addresses, or geographical billing details.</li>
              <li>Email addresses (unless you voluntarily submit one for technical support).</li>
              <li>Phone numbers or mobile identifiers.</li>
              <li>Government-issued IDs (passport, driver's license) or Know-Your-Customer (KYC) documentation.</li>
              <li>Credit card details or banking credentials.</li>
            </ul>
            <div className="callout-box callout-info" style={{ margin: 0 }}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Identity Scope:</strong> Your identity on DotMarket is entirely defined by your public cryptographic wallet address. No account registration or password setup is supported or required.
              </div>
            </div>
          </section>

          {/* 3. Geo-Location & Compliance */}
          <section id="geoblock" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>3. Geo-Location & Compliance</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              Consistent with regulatory structures enforced across prediction markets (like Polymarket), DotMarket restricts interface access for users in prohibited jurisdictions.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We process IP addresses for the sole purpose of determining geographical location and enforcing block filters (geo-blocking). If we detect that your IP address originates from a restricted jurisdiction, including but not limited to the **United States**, you will be blocked from accessing the trade interface.
            </p>
            <div className="callout-box callout-warning" style={{ margin: 0 }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Geo-IP Storage:</strong> IP addresses processed for geographic checks are analyzed on-the-fly at the edge (CDN node). They are not written to long-term database tables, combined with wallet addresses, or used to build user profiles.
              </div>
            </div>
          </section>

          {/* 4. Non-Custodial Interactions */}
          <section id="wallet" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>4. Non-Custodial Interactions</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              Connecting your Web3 wallet extension (such as MetaMask or Coinbase Wallet) to the Interface only makes your public wallet address visible to the client application.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              This connection is read-only. DotMarket has no custody of your digital assets, no access to your private key or seed phrase, and cannot initiate or authorize transactions on your behalf. Every prediction entry or reward claim must be manually reviewed and cryptographically signed inside your wallet extension.
            </p>
          </section>

          {/* 5. Blockchain Immutability & GDPR */}
          <section id="blockchain" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>5. Blockchain Immutability & GDPR</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              By participating in prediction markets, you interact with public smart contracts. All transactions (predictions, pools adjustments, resolutions, and withdrawals) are permanent and cryptographically verified.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              Because public blockchains are decentralized and globally replicated, their records are immutable. Traditional data privacy rights (like the GDPR "Right to be Forgotten" or "Right to Deletion") cannot be applied to details written to on-chain blocks.
            </p>
            <div className="callout-box callout-info" style={{ margin: 0 }}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Immutable Data:</strong> Once you submit a transaction, your public wallet address and the associated prediction logs are permanently recorded. If you require absolute anonymity, do not interact with the DotMarket protocol.
              </div>
            </div>
          </section>

          {/* 6. Technical Telemetry We Collect */}
          <section id="collect" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>6. Technical Telemetry We Collect</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              To ensure platform security and optimize RPC query speeds, we compile technical log parameters:
            </p>
            <ul className="list-items" style={{ margin: 0 }}>
              <li><strong>Network Telemetry:</strong> Request latency, query errors, and server response times.</li>
              <li><strong>Browser Details:</strong> User-agent strings, system language, screen resolution, and browser engines.</li>
              <li><strong>Usage Metrics:</strong> Click paths, viewport scroll ranges, and feature interactions (excluding any association with real-world PII).</li>
            </ul>
          </section>

          {/* 7. Cookies & Local Storage */}
          <section id="cookies" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>7. Cookies & Local Storage</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We do not use tracking cookies for ad networks or behavioral retargeting. We utilize local storage on your device to remember user preferences:
            </p>
            <ul className="list-items" style={{ margin: '0 0 16px' }}>
              <li>Your wallet connection state (to automatically prompt connection).</li>
              <li>Chart settings, scale bounds, and selected indicator configurations.</li>
              <li>Display themes (dark mode preferences).</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              You can wipe your browser's local storage and cache at any time using your browser settings.
            </p>
          </section>

          {/* 8. Third-Party Web3 Integrations */}
          <section id="thirdparty" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>8. Third-Party Web3 Integrations</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              The Interface interacts with third-party decentralized applications and service layers:
            </p>
            <ul className="list-items" style={{ margin: 0 }}>
              <li><strong>Node/RPC Providers:</strong> Public RPC node gateways receive your IP address and wallet details when querying smart contract states.</li>
              <li><strong>Pyth Network:</strong> Streams oracle price updates. Price verification feeds are processed directly on-chain.</li>
              <li><strong>Content Delivery Networks:</strong> We use Vercel CDNs to cache page content globally. Vercel registers technical header parameters during assets delivery.</li>
            </ul>
          </section>

          {/* 9. Infrastructure Security */}
          <section id="security" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>9. Infrastructure Security</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We employ SSL/TLS encryption across all network transfers to secure API pathways. However, because DotMarket is non-custodial, the ultimate security barrier relies on smart contract integrity.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              Our smart contracts are open-source and verified on-chain, meaning all execution parameters and fund distribution logic are completely public, inspectable, and auditable by anyone.
            </p>
          </section>

          {/* 10. Your Rights */}
          <section id="rights" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>10. Your Rights</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              Since we do not store PII, traditional CCPA/GDPR access and edit rights are managed differently:
            </p>
            <ul className="list-items" style={{ margin: 0 }}>
              <li><strong>On-Chain Portability:</strong> You can export your entire transaction history using standard block explorers.</li>
              <li><strong>Opt-Out:</strong> You can use privacy extensions (like ad blockers or VPNs) to restrict the collection of anonymous telemetry.</li>
              <li><strong>Local Cleanup:</strong> You can erase your local cache and storage parameters within browser settings to reset cryptographic sessions.</li>
            </ul>
          </section>

          {/* 11. Age Restrictions */}
          <section id="children" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>11. Age Restrictions</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              DotMarket is strictly intended for individuals who have attained the age of legal majority in their local jurisdiction (e.g. 18 years or older). We do not knowingly allow or collect data from minors. If you are under the legal age, do not connect your Web3 wallet or use the Interface.
            </p>
          </section>

          {/* 12. Policy Revisions */}
          <section id="updates" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>12. Policy Revisions</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              This policy is subject to changes as decentralized compliance frameworks adapt, or as new smart contract iterations are deployed. We will indicate revisions by updating the "Last Updated" timestamp at the top of this document. Revisions are effective immediately upon posting.
            </p>
          </section>

          {/* 13. Contact & Support */}
          <section id="contact" className="privacy-card" style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>13. Contact & Support</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 32px' }}>
              If you have queries regarding RPC logs, geo-location filters, or smart contract interactions, contact our Web3 legal operations desk:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Compliance</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>legal@dotmarket.space</span>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Developer Repository</span>
                <a href="https://github.com/fazleshabbir/DotMarket" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>GitHub Source Code</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleScrollToTop}
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 90,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}
            aria-label="Back to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '48px 24px 32px',
        maxWidth: '1200px',
        margin: '80px auto 0',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '13px' }}>
          <Link href="/docs/user-guide/introduction" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Documentation</Link>
          <Link href="/brand-kit" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Brand Kit</Link>
          <Link href="/privacy" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          &copy; {new Date().getFullYear()} dotMarket. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
