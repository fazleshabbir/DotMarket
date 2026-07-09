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
    predictionMarket: (process.env.NEXT_PUBLIC_ARC_MARKET_ADDRESS as `0x${string}`) || '0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938',
  },
  nativeToken: { symbol: 'USDC', decimals: 18 },
  bettingToken: { symbol: 'USDC', decimals: 18, isNative: true },
};

// ── Robinhood Chain Testnet ─────────────────────────────────────────────────
export const robinhoodTestnetChain: Chain = {
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || 'https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Robinhood Explorer', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
  testnet: true,
};

export const robinhoodTestnetConfig: ChainConfig = {
  chain: robinhoodTestnetChain,
  contracts: {
    // Placeholder address until deployed on Robinhood Testnet
    predictionMarket: (process.env.NEXT_PUBLIC_ROBINHOOD_MARKET_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000',
  },
  nativeToken: { symbol: 'ETH', decimals: 18 },
  // Betting UI thinks in USDT, but sends native ETH
  bettingToken: { symbol: 'USDT', decimals: 18, isNative: false },
};

// ── Export Map ──────────────────────────────────────────────────────────────
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [arcTestnetChain.id]: arcTestnetConfig,
  [robinhoodTestnetChain.id]: robinhoodTestnetConfig,
};

// Default fallback chain
export const DEFAULT_CHAIN_ID = arcTestnetChain.id;
