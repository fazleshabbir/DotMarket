'use client';

import { createConfig, http } from 'wagmi';
import { type Chain } from 'viem';
import { injected } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';

import { arcTestnetChain } from '../config/chains';

// ── Wagmi Configuration ─────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: [arcTestnetChain],
  connectors: [injected()],
  transports: {
    [arcTestnetChain.id]: http(arcTestnetChain.rpcUrls.default.http[0]),
  },
  ssr: true,
});

// ── React Query Client ──────────────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
