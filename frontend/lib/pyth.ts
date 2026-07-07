export const PRICE_FEEDS = {
  'BTC/USD': '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b',
  'ETH/USD': '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
  'SOL/USD': '0xfe650f0367d4a7ef9815a593ea15d36593f0643aaaf0149bb04be67ab851decd',
} as const;

export type PricePair = keyof typeof PRICE_FEEDS;

export const HERMES_URL = 'https://hermes-beta.pyth.network';

/**
 * Convert a Pyth int64 price with expo to a human-readable number.
 * Pyth prices come as (price, expo) where real_price = price * 10^expo.
 * expo is typically -8, so price 6500000000000 with expo -8 = $65,000.00
 */
export function pythPriceToNumber(price: bigint, expo: number = -8): number {
  return Number(price) * Math.pow(10, expo);
}
