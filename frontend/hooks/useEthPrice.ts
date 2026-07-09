import { useState, useEffect } from 'react';

const CACHE_DURATION = 15000; // 15 seconds
let cachedPrice: number | null = null;
let lastFetchTime = 0;
let fetchPromise: Promise<number> | null = null;

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(cachedPrice);
  const [loading, setLoading] = useState<boolean>(!cachedPrice);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchPrice = async () => {
      const now = Date.now();
      if (cachedPrice && now - lastFetchTime < CACHE_DURATION) {
        if (isMounted) {
          setPrice(cachedPrice);
          setLoading(false);
          setError(false);
        }
        return;
      }

      if (!fetchPromise) {
        fetchPromise = fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch price');
            return res.json();
          })
          .then(data => {
            const p = parseFloat(data.price);
            cachedPrice = p;
            lastFetchTime = Date.now();
            return p;
          })
          .finally(() => {
            fetchPromise = null;
          });
      }

      try {
        const p = await fetchPromise;
        if (isMounted) {
          setPrice(p);
          setLoading(false);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchPrice();
    
    // Auto refresh
    intervalId = setInterval(fetchPrice, CACHE_DURATION);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { price, loading, error, lastUpdated: lastFetchTime };
}
