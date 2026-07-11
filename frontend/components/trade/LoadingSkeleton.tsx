'use client';

import React, { memo } from 'react';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 16,
        background: '#000000',
        width: '100%',
        minHeight: '80vh',
      }}
    >
      {/* Left panel skeleton (Chart & Positions Table) */}
      <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 500 }}>
        {/* Chart Card Skeleton */}
        <Card hoverEffect={false} style={{ height: '420px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="180px" height="24px" />
            <Skeleton width="120px" height="24px" />
          </div>
          <Skeleton width="100%" height="320px" borderRadius="10px" />
        </Card>

        {/* Positions Table Skeleton */}
        <Card hoverEffect={false} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton width="100px" height="24px" />
            <Skeleton width="100px" height="24px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width="20%" height="20px" />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="25%" height="20px" />
                <Skeleton width="15%" height="20px" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right panel skeleton (Betting Sidebar) */}
      <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Active Round Card Skeleton */}
        <Card hoverEffect={false} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="120px" height="20px" />
            <Skeleton width="80px" height="20px" borderRadius="10px" />
          </div>
          <Skeleton width="100%" height="36px" />
          <Skeleton width="100%" height="60px" />
          <Skeleton width="100%" height="48px" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Skeleton width="100%" height="44px" borderRadius="10px" />
            <Skeleton width="100%" height="44px" borderRadius="10px" />
          </div>
        </Card>

        {/* Last Round Card Skeleton */}
        <Card hoverEffect={false} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="120px" height="20px" />
            <Skeleton width="80px" height="20px" borderRadius="10px" />
          </div>
          <Skeleton width="100%" height="36px" />
          <Skeleton width="100%" height="48px" />
        </Card>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
