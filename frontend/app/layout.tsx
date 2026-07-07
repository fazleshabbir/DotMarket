import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'dotMarket — Decentralized Prediction Market',
  description:
    'High-frequency, pari-mutuel prediction market for crypto pairs. Bet UP or DOWN on BTC, ETH, SOL with 2–10 minute rounds on ARC blockchain.',
  keywords: ['prediction market', 'crypto', 'DeFi', 'ARC', 'trading'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
