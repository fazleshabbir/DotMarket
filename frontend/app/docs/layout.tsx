import React from 'react';
import { Sidebar } from '@/components/docs/Sidebar';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff' }}>
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
          `}</style>
          <Link href="/trade" className="premium-trade-btn">
            <span>Trade Terminal</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </Link>
          <ConnectButton />
        </div>
      </header>
      
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        maxWidth: '1400px', 
        margin: '0 auto', 
        width: '100%',
        paddingTop: '64px' // Account for fixed header
      }}>
        {/* Left Sidebar Navigation */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: 'calc(100vh - 64px)',
          position: 'sticky',
          top: '64px',
          overflowY: 'auto',
          padding: '32px 0'
        }}>
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: '48px 64px 96px',
          maxWidth: '880px'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
