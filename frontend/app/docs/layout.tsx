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
          <Link href="/" style={{ fontSize: '18px', fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em', color: '#ffffff', textDecoration: 'none' }}>
            DotMarket
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Documentation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/trade" style={{ fontSize: '14px', color: '#ffffff', textDecoration: 'none' }}>Trade App</Link>
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
