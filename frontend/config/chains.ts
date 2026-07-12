import { type Chain } from 'viem';

export interface ChainConfig {
  chain: Chain;
  contracts: {
    predictionMarket: `0x${string}`;
  };
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  bettingToken: {
    symbol: string;
    decimals: number;
    // For chains where betting token != native token but uses native for txs
    isNative: boolean; 
  };
}

// ── ARC Testnet ─────────────────────────────────────────────────────────────
export const arcTestnetChain: Chain = {
  id: 5_042_002,
  name: 'ARC Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://5042002.rpc.thirdweb.com'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
};

export const arcTestnetConfig: ChainConfig = {
  chain: arcTestnetChain,
  contracts: {
    predictionMarket: (process.env.NEXT_PUBLIC_ARC_MARKET_ADDRESS as `0x${string}`) || '0xA801878f362D7c0093Fd96B6616b33812c28ce8E',
  },
  nativeToken: { symbol: 'USDC', decimals: 18 },
  bettingToken: { symbol: 'USDC', decimals: 18, isNative: true },
};

// ── Export Map ──────────────────────────────────────────────────────────────
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [arcTestnetChain.id]: arcTestnetConfig,
};

// Default fallback chain
export const DEFAULT_CHAIN_ID = arcTestnetChain.id;
