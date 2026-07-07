'use client';

import { createConfig, http } from 'wagmi';
import { type Chain } from 'viem';
import { injected } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';

// ── ARC Testnet Chain Definition ────────────────────────────────────────────
export const arcTestnet: Chain = {
  id: 5_042_002,
  name: 'ARC Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://5042002.rpc.thirdweb.com'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
};

// ── Wagmi Configuration ─────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http('https://5042002.rpc.thirdweb.com'),
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
