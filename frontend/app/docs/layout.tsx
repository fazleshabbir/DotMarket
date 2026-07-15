'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/docs/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Helper to format path name into readable title
  const getPageTitle = (pathStr: string) => {
    if (!pathStr) return 'Documentation';
    const parts = pathStr.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'docs') return 'Introduction';
    return lastPart
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff' }}>
      
      {/* Global CSS Stylesheet */}
      <style>{`
        .premium-trade-btn {
          font-size: 13px;
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
          cursor: pointer;
        }
        .premium-trade-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.03);
        }

        .docs-sidebar-container {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-2, rgba(255,255,255,0.08));
          height: calc(100vh - 64px);
          position: sticky;
          top: 64px;
          overflow-y: auto;
          padding: 28px 0;
          background: rgba(4,4,4,0.5);
        }

        .mobile-sub-header {
          display: none;
        }

        .docs-layout-container {
          display: flex;
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          padding-top: 64px;
        }

        .docs-main-content {
          flex: 1;
          min-width: 0;
          padding: 48px 64px 96px;
          max-width: 880px;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-1, #f0f0f0);
        }

        /* ── Prose: Headings ── */
        .docs-main-content h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--text-1, #f0f0f0);
          letter-spacing: -0.03em;
          margin: 0 0 24px;
        }
        .docs-main-content h2 {
          font-size: 1.35rem;
          font-weight: 650;
          line-height: 1.35;
          color: var(--text-1, #f0f0f0);
          letter-spacing: -0.02em;
          margin: 48px 0 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-2, rgba(255,255,255,0.08));
        }
        .docs-main-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text-1, #f0f0f0);
          letter-spacing: -0.01em;
          margin: 32px 0 12px;
        }
        .docs-main-content h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-1, #f0f0f0);
          margin: 24px 0 8px;
        }

        /* ── Prose: Paragraphs & Lists ── */
        .docs-main-content p {
          margin: 0 0 16px;
          color: var(--text-2, #a3a3a3);
        }
        .docs-main-content ul,
        .docs-main-content ol {
          margin: 0 0 16px;
          padding-left: 24px;
          color: var(--text-2, #a3a3a3);
        }
        .docs-main-content li {
          margin-bottom: 6px;
        }

        /* ── Prose: Inline Code ── */
        .docs-main-content code {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.82em;
          background: var(--bg-raised, #0a0a0a);
          color: var(--text-1, #f0f0f0);
          border: 1px solid var(--border-2, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 10px);
          padding: 2px 7px;
        }

        /* ── Prose: Code Blocks ── */
        .docs-main-content pre {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.85em;
          background: var(--bg-raised, #0a0a0a);
          border: 1px solid var(--border-2, rgba(255,255,255,0.08));
          border-radius: var(--radius-lg, 14px);
          padding: 20px 24px;
          overflow-x: auto;
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .docs-main-content pre code {
          background: none;
          border: none;
          border-radius: 0;
          padding: 0;
          font-size: inherit;
        }

        /* ── Prose: Links ── */
        .docs-main-content a {
          color: var(--text-1, #f0f0f0);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s ease;
        }
        .docs-main-content a:hover {
          border-bottom-color: var(--text-1, #f0f0f0);
        }

        /* ── Prose: Blockquote ── */
        .docs-main-content blockquote {
          margin: 0 0 20px;
          padding: 14px 20px;
          border-left: 3px solid rgba(255,255,255,0.15);
          background: var(--bg-raised, #0a0a0a);
          border-radius: 0 var(--radius-md, 10px) var(--radius-md, 10px) 0;
          color: var(--text-2, #a3a3a3);
          font-style: italic;
        }

        /* ── Prose: HR ── */
        .docs-main-content hr {
          border: none;
          border-top: 1px solid var(--border-2, rgba(255,255,255,0.08));
          margin: 40px 0;
        }

        .docs-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 35;
        }

        @media (max-width: 768px) {
          .docs-sidebar-container {
            position: fixed;
            top: 64px;
            left: -280px;
            z-index: 40;
            transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            height: calc(100vh - 64px);
            box-shadow: 20px 0 40px rgba(0,0,0,0.5);
          }
          
          .docs-sidebar-container.open {
            left: 0;
          }

          .mobile-sub-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 48px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            background: rgba(10,10,10,0.8);
            backdrop-filter: blur(12px);
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            padding: 0 16px;
            z-index: 30;
          }

          .docs-layout-container {
            flex-direction: column;
            padding-top: 112px; /* 64px + 48px */
          }

          .docs-main-content {
            padding: 24px 16px 64px;
          }

          .docs-mobile-overlay.open {
            display: block;
          }
        }
      `}</style>

      {/* Main Sticky Header */}
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
                <mask id="docsHeaderLogoMask">
                  <rect x="0" y="0" width="200" height="60" fill="white" />
                  <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                </mask>
              </defs>
              <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#docsHeaderLogoMask)" />
              <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
              <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
              <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
            </svg>
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Docs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/trade" className="premium-trade-btn">
            <span>Trade Terminal</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </Link>
        </div>
      </header>

      {/* Mobile Sub-Header Navigation */}
      <div className="mobile-sub-header">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          <span>Menu</span>
        </button>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          {pageTitle}
        </span>
      </div>

      {/* Overlay backdrop for mobile menu */}
      <div 
        className={`docs-mobile-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      
      {/* Layout Shell */}
      <div className="docs-layout-container">
        {/* Left Sidebar Navigation Drawer */}
        <div className={`docs-sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
          <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content Area */}
        <main className="docs-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
