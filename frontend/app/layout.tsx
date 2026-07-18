import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Providers } from './providers';

const BASE_URL = 'https://dotmarket.space';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'DotMarket — Decentralized Prediction Market',
    template: '%s | DotMarket',
  },
  description:
    'High-frequency, pari-mutuel prediction market for crypto pairs. Bet UP or DOWN on BTC, ETH, SOL with 2–10 minute rounds on ARC blockchain.',
  keywords: ['prediction market', 'crypto', 'DeFi', 'ARC', 'trading'],
  openGraph: {
    type: 'website',
    url: BASE_URL,
    title: 'DotMarket — Decentralized Prediction Market',
    description:
      'High-frequency, pari-mutuel prediction market for crypto pairs. Bet UP or DOWN on BTC, ETH, SOL with 2–10 minute rounds on ARC blockchain.',
    siteName: 'DotMarket',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DotMarket Prediction Market',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dotmarketai',
    creator: '@dotmarketai',
    title: 'DotMarket — Decentralized Prediction Market',
    description:
      'High-frequency, pari-mutuel prediction market for crypto pairs. Bet UP or DOWN on BTC, ETH, SOL with 2–10 minute rounds.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'LltopqYWm3cWqpIOEUrgXDar-0OFn9u5ZLmehvUHcaw',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

import { COMMUNITY_LINKS } from '@/config/communityLinks';

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "DotMarket",
      "url": BASE_URL,
      "logo": `${BASE_URL}/icon.png`,
      "sameAs": [
        COMMUNITY_LINKS.twitter,
        COMMUNITY_LINKS.discord,
        COMMUNITY_LINKS.telegram
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": "DotMarket",
      "publisher": {
        "@id": `${BASE_URL}/#organization`
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          id="schema-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics Placeholder */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
