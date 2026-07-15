'use client';

import React, { memo, useState, useEffect } from 'react';

interface PriceTickerProps {
  price: number;
}

export const PriceTicker = memo(function PriceTicker({ price }: PriceTickerProps) {
  const [prevPrice, setPrevPrice] = useState(price);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price > prevPrice) {
      setDirection('up');
      const timer = setTimeout(() => setDirection(null), 300);
      setPrevPrice(price);
      return () => clearTimeout(timer);
    } else if (price < prevPrice) {
      setDirection('down');
      const timer = setTimeout(() => setDirection(null), 300);
      setPrevPrice(price);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);

  return (
    <strong
      style={{
        color: 'var(--text-1)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 700,
        display: 'inline-block',
        transform: direction ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
      }}
    >
      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </strong>
  );
});

PriceTicker.displayName = 'PriceTicker';
