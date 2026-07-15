'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, queryClient } from '@/lib/wagmi';

import { MarketProvider } from '@/lib/marketStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => queryClient);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <MarketProvider>
          {children}
        </MarketProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
