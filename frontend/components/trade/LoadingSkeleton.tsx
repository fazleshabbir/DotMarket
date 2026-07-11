'use client';

import React, { memo } from 'react';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70fr 30fr',
        gap: 24,
        padding: '12px 24px 24px 24px',
        background: '#000000',
        width: '100%',
        maxWidth: 1400,
        margin: '0 auto',
        height: 'calc(100vh - 170px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Left panel skeleton (Chart & Positions Table) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
        {/* Chart Card Skeleton (65%) */}
        <Card hoverEffect={false} style={{ height: '65%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="140px" height="20px" />
            <Skeleton width="100px" height="20px" />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>LOADING MARKET DATA...</span>
          </div>
        </Card>

        {/* Positions Table Skeleton (35%) */}
        <Card hoverEffect={false} style={{ height: '35%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="100px" height="18px" />
            <Skeleton width="120px" height="18px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width="20%" height="16px" />
                <Skeleton width="15%" height="16px" />
                <Skeleton width="25%" height="16px" />
                <Skeleton width="15%" height="16px" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right panel skeleton (Betting Sidebar) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
        {/* Place Bet Skeleton (34%) */}
        <Card hoverEffect={false} style={{ height: '34%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="100px" height="18px" />
            <Skeleton width="60px" height="18px" borderRadius="10px" />
          </div>
          <Skeleton width="100%" height="32px" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Skeleton width="100%" height="32px" borderRadius="8px" />
            <Skeleton width="100%" height="32px" borderRadius="8px" />
          </div>
        </Card>

        {/* Live Market Skeleton (42%) */}
        <Card hoverEffect={false} style={{ height: '42%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="120px" height="18px" />
            <Skeleton width="60px" height="18px" borderRadius="10px" />
          </div>
          <Skeleton width="100%" height="40px" />
          <Skeleton width="100%" height="24px" />
        </Card>

        {/* Previous Market Skeleton (24%) */}
        <Card hoverEffect={false} style={{ height: '24%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="120px" height="18px" />
            <Skeleton width="60px" height="18px" borderRadius="10px" />
          </div>
          <Skeleton width="100%" height="20px" />
        </Card>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
