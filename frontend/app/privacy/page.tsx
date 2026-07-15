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
  { id: 'introduction', title: '1. Introduction', icon: <Info size={14} /> },
  { id: 'collect', title: '2. Information We Collect', icon: <FileText size={14} /> },
  { id: 'wallet', title: '3. Wallet Information', icon: <Key size={14} /> },
  { id: 'use', title: '4. How We Use Information', icon: <CheckCircle2 size={14} /> },
  { id: 'cookies', title: '5. Cookies & Analytics', icon: <EyeOff size={14} /> },
  { id: 'blockchain', title: '6. Blockchain Data', icon: <Globe size={14} /> },
  { id: 'thirdparty', title: '7. Third-Party Services', icon: <ExternalLink size={14} /> },
  { id: 'security', title: '8. Data Security', icon: <Shield size={14} /> },
  { id: 'rights', title: '9. Your Rights', icon: <FileText size={14} /> },
  { id: 'children', title: '10. Children\'s Privacy', icon: <AlertTriangle size={14} /> },
  { id: 'international', title: '11. International Users', icon: <Globe size={14} /> },
  { id: 'updates', title: '12. Policy Updates', icon: <Info size={14} /> },
  { id: 'contact', title: '13. Contact', icon: <Mail size={14} /> },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Accordion state for FAQs / sections on mobile
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
      
      {/* ── 1. Reading Progress Bar ───────────────────────────────── */}
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

      {/* ── 2. Sticky Navbar ───────────────────────────────────────── */}
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

      {/* ── 3. Outer Container ────────────────────────────────────── */}
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

          {/* ── 4. Hero Section ──────────────────────────────────────── */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '6px 12px', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)' }}>
                Last Updated: July 16, 2026
              </span>
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '680px', marginBottom: '32px' }}>
              Learn how DotMarket collects, uses, protects, and processes your information while using our decentralized prediction market.
            </p>

            {/* Quick Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effective Date</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>July 16, 2026</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Reading Time</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>6 Minutes</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicability</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>Global (Decentralized)</div>
              </div>
            </div>
          </div>

          {/* ── 5. Mobile Accordion Navigation ───────────────────────── */}
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

          {/* ── 6. Privacy Policy Content ────────────────────────────── */}

          {/* 1. Introduction */}
          <section id="introduction" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>1. Introduction</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              Welcome to DotMarket. We are committed to protecting the privacy and security of our users. DotMarket operates as a non-custodial, decentralized prediction protocol built on the Arc Testnet. 
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              Before using our platform, it is essential to understand that by interacting with smart contracts, your transaction details are permanently recorded on public ledger systems. We do not have the power to alter, erase, or censor this information.
            </p>
            <div className="callout-box callout-info">
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>On-Chain Data Public Nature:</strong> Ledger records are transparently readable by anyone. Any interaction with DotMarket contracts, including placing predictions or claiming payouts, links your wallet address to those transactions publicly.
              </div>
            </div>
          </section>

          {/* 2. Information We Collect */}
          <section id="collect" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>2. Information We Collect</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We collect minimal data necessary to maintain security, optimize platform responsiveness, and compile statistical telemetry.
            </p>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>Categories of Collected Data:</h4>
            <ul className="list-items">
              <li><strong>Public Cryptographic Wallet Address:</strong> Collected upon connecting your Web3 provider (e.g. MetaMask, Coinbase Wallet).</li>
              <li><strong>On-Chain Transaction Details:</strong> Prediction entries, claims, contract logs.</li>
              <li><strong>Device & Telemetry Information:</strong> Browser type, operating system version, anonymous platform performance parameters.</li>
              <li><strong>Optional Contact Details:</strong> Email addresses or social identities, only if provided voluntarily during support requests.</li>
            </ul>

            <div className="callout-box callout-warning">
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>What We DO NOT Collect:</strong> We never collect, store, or request your private keys, seed phrases, physical addresses, government IDs, or credit card details. DotMarket remains fully non-custodial.
              </div>
            </div>
          </section>

          {/* 3. Wallet Information */}
          <section id="wallet" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>3. Wallet Information</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              To participate in predictions, users must connect a cryptographic Web3 wallet. Connecting a wallet does not grant DotMarket custody, access to private keys, or control over your digital assets.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              All transactions, including predictions and reward claims, require manual approval and signature within your wallet provider's interface. You remain in absolute control of your keys and funds at all times.
            </p>
          </section>

          {/* 4. How We Use Information */}
          <section id="use" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>4. How We Use Information</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              We use the compiled metrics to optimize user experience, secure server endpoints, and analyze pool activity:
            </p>
            <ul className="list-items">
              <li><strong>Platform Optimization:</strong> Speeding up loading times of active prediction panels and charts.</li>
              <li><strong>Security Monitoring:</strong> Defending RPC gateways and analytics endpoints against DDoS attacks.</li>
              <li><strong>Debugging & Crash Analysis:</strong> Identifying client side lag or state provider synchronization issues.</li>
              <li><strong>Community Analytics:</strong> Evaluating dynamic multiplier ranges and historical volumes.</li>
            </ul>
            <div className="callout-box callout-info">
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#22c55e' }} />
              <div>
                <strong>Zero Selling Policy:</strong> DotMarket does not sell, rent, or distribute your public address, browser metadata, or any other collected analytics to third-party data brokers or marketing networks.
              </div>
            </div>
          </section>

          {/* 5. Cookies & Analytics */}
          <section id="cookies" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>5. Cookies & Analytics</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We utilize local storage and session storage within your browser to store system preferences (such as your chosen chart scale or layout states) and keep track of active connection parameters.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              You can configure your browser to reject all local storage components or cookies. However, doing so may reset your display configurations (like dark mode styling or terminal chart lines) on every page refresh.
            </p>
          </section>

          {/* 6. Blockchain Data */}
          <section id="blockchain" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>6. Blockchain Data</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              The Arc Testnet blockchain is a public decentralized ledger. All contract invocations, deposit transactions, and payout settlements are stored forever in block history.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              Because blockchain records are immutable, traditional "Right to Erasure" (or "Right to be Forgotten") legal claims cannot be enforced on-chain. DotMarket cannot edit, delete, or hide smart contract data or transactions.
            </p>
          </section>

          {/* 7. Third-Party Services */}
          <section id="thirdparty" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>7. Third-Party Services</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              Our frontend interface relies on third-party node providers, database networks, and web hosting platforms to function:
            </p>
            <ul className="list-items">
              <li><strong>Hosting & Serverless Functions:</strong> Provided by Vercel. Their platform registers request header details for caching.</li>
              <li><strong>Node/RPC Providers:</strong> Providers used to query block data from the Arc Testnet. They analyze query volume to secure RPC endpoints.</li>
              <li><strong>Oracle Infrastructure:</strong> Pyth Network streams price updates to the Keeper system and smart contracts.</li>
            </ul>
          </section>

          {/* 8. Data Security */}
          <section id="security" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>8. Data Security</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 16px' }}>
              We implement industry-standard encryption protocols (SSL/HTTPS) across all network calls to ensure third parties cannot intercept data transfers.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              Furthermore, because all transaction data flows directly into audited open-source smart contracts, security is cryptographically guaranteed rather than relying on private storage infrastructure.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section id="rights" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>9. Your Rights</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 20px' }}>
              Depending on your local jurisdiction (e.g. GDPR in Europe, CCPA in California), you may possess specific privacy rights regarding your data:
            </p>
            <ul className="list-items">
              <li><strong>Access:</strong> You can review all transaction data linked to your public address using open block explorers.</li>
              <li><strong>Opt-Out:</strong> You can disable analytics or tracking scripts by configuring your browser's "Do Not Track" settings.</li>
              <li><strong>Browser Cleanup:</strong> You can wipe all local storage objects directly from your browser options at any time.</li>
            </ul>
          </section>

          {/* 10. Children's Privacy */}
          <section id="children" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>10. Children's Privacy</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              DotMarket is strictly intended for individuals who have attained the age of legal majority in their local jurisdiction. We do not knowingly compile metadata or allow usage by minors. If we learn that we have stored any personal information of a minor, it will be immediately removed.
            </p>
          </section>

          {/* 11. International Users */}
          <section id="international" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>11. International Users</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              DotMarket is hosted on global serverless content delivery networks (CDNs). By accessing the website, your encrypted request data may be stored in nodes outside your country of origin. Blockchain ledgers replicated across international server networks process all smart contract calls.
            </p>
          </section>

          {/* 12. Policy Updates */}
          <section id="updates" className="privacy-card">
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>12. Policy Updates</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: 0 }}>
              We update this policy periodically to reflect changes in compliance legislation, smart contract adjustments, or backend telemetry updates. The updated revision date will always be displayed at the top of this page. We encourage you to review it regularly to remain informed.
            </p>
          </section>

          {/* 13. Contact */}
          <section id="contact" className="privacy-card" style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px' }}>13. Contact Support</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '14px', margin: '0 0 32px' }}>
              If you have any questions regarding on-chain privacy, cookies, or node integrations, contact our compliance team:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Compliance</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>legal@dotmarket.space</span>
              </div>
              <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community & GitHub</span>
                <a href="https://github.com/fazleshabbir/DotMarket" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>GitHub Repository</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* ── 7. Back to Top Button ────────────────────────────────── */}
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

      {/* ── 8. Footer ────────────────────────────────────────────── */}
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
