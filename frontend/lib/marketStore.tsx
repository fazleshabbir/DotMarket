'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useReadContracts, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';

interface RoundData {
  roundId: bigint;
  startPrice: bigint;
  closePrice: bigint;
  totalUpAmount: bigint;
  totalDownAmount: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  endTimestamp: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  resolved: boolean;
  canceled: boolean;
}

interface UserBet {
  position: number;
  amount: bigint;
  claimed: boolean;
}

interface Toast {
  show: boolean;
  message: string;
  submessage?: string;
  type: 'success' | 'info' | 'error' | 'win' | 'loss' | 'refund';
}

interface MarketState {
  // Live Tickers & Calculations
  btcPrice: number;
  twap: number;
  now: number;
  walletBalance: number;
  balanceSymbol: string;

  // On-Chain Round IDs & Data
  currentRoundId: bigint;
  activeRound: RoundData | undefined;
  activeMultipliers: any;
  activeUserBet: UserBet | undefined;

  prevRoundId: bigint;
  prevRound: RoundData | undefined;
  prevMultipliers: any;
  prevUserBet: UserBet | undefined;
  isClaimable: boolean;

  // Calculated Stats
  activeTotalPool: bigint;
  activeUpPercent: number;
  activeDownPercent: number;
  activeUpMultiplier: number;
  activeDownMultiplier: number;

  prevTotalPool: bigint;
  prevUpPercent: number;
  prevDownPercent: number;
  prevUpMultiplier: number;
  prevDownMultiplier: number;

  // Global Time Status for Active Round (currentRoundId)
  timeLeftToLock: number;
  timeLeftToEnd: number;
  marketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS';

  // Global Time Status for Previous Round (prevRoundId)
  prevTimeLeftToLock: number;
  prevTimeLeftToEnd: number;
  prevMarketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS';

  // Toast API
  toast: Toast | null;
  triggerToast: (message: string, submessage?: string, type?: 'success' | 'info' | 'error' | 'win' | 'loss' | 'refund') => void;
  lockedEntryPrice: number;
}

const MarketContext = createContext<MarketState | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  // ── 1. Live Tick Clock ────────────────────────────────────────────────────
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── 2. Live Pyth Hermes Price Feed (with Binance Fallback) & TWAP ──────────
  const [btcPrice, setBtcPrice] = useState(64000.0);
  const [twap, setTwap] = useState(64000.0);
  const priceBuffer = useRef<number[]>([]);

  useEffect(() => {
    const fetchPrice = async () => {
      // 1. Try Pyth Hermes API first
      try {
        const res = await fetch('https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', {
          signal: AbortSignal.timeout(5000)
        });
        const data = await res.json();
        if (data && data.parsed && data.parsed[0]) {
          const priceStr = data.parsed[0].price.price;
          const expo = data.parsed[0].price.expo;
          const currentPrice = Number(priceStr) * Math.pow(10, expo);

          setBtcPrice(currentPrice);

          // Update 5-second TWAP buffer
          priceBuffer.current.push(currentPrice);
          if (priceBuffer.current.length > 5) {
            priceBuffer.current.shift();
          }
          const sum = priceBuffer.current.reduce((a, b) => a + b, 0);
          setTwap(sum / priceBuffer.current.length);
          return;
        }
      } catch (err) {
        console.warn('Pyth Hermes price fetch failed, trying Binance fallback:', err);
      }

      // 2. Fallback to Binance
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const data = await res.json();
        if (data && data.price) {
          const currentPrice = parseFloat(data.price);
          setBtcPrice(currentPrice);

          priceBuffer.current.push(currentPrice);
          if (priceBuffer.current.length > 5) {
            priceBuffer.current.shift();
          }
          const sum = priceBuffer.current.reduce((a, b) => a + b, 0);
          setTwap(sum / priceBuffer.current.length);
        }
      } catch (err) {
        console.error('Error fetching fallback Binance price:', err);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── 3. Live Wallet Balance ───────────────────────────────────────────────
  const { data: balanceData } = useBalance({
    address: address,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const walletBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const balanceSymbol = balanceData?.symbol || 'USDC';

  // ── 4. Main Contract Polling ─────────────────────────────────────────────
  const { data: rawCurrentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 3000 },
  });
  const currentRoundId = rawCurrentRoundId ? BigInt(rawCurrentRoundId.toString()) : 0n;

  const activeRoundId = currentRoundId;
  const prevRoundId = activeRoundId > 1n ? activeRoundId - 1n : 0n;

  // Batch query for active and previous round data parameters
  const { data: batchData } = useReadContracts({
    contracts: [
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound', args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet', args: [activeRoundId, address || '0x0000000000000000000000000000000000000000'] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound', args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet', args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'claimable', args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'] }
    ],
    query: {
      enabled: activeRoundId > 0n,
      refetchInterval: 3000
    }
  });

  const activeRound = batchData?.[0]?.result as RoundData | undefined;
  const activeMultipliers = batchData?.[1]?.result;
  const activeUserBet = batchData?.[2]?.result as UserBet | undefined;
  const prevRound = batchData?.[3]?.result as RoundData | undefined;
  const prevMultipliers = batchData?.[4]?.result;
  const prevUserBet = batchData?.[5]?.result as UserBet | undefined;
  const isClaimable = !!batchData?.[6]?.result;

  // ── 5. Derived Stat Calculations ──────────────────────────────────────────
  // Active Round Stats
  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeRound!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  // Previous Round Stats
  const prevTotalPool = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  const prevUpPercent = prevTotalPool > 0n ? Number((prevRound!.totalUpAmount * 10000n) / prevTotalPool) / 100 : 50;
  const prevDownPercent = prevTotalPool > 0n ? 100 - prevUpPercent : 50;

  const prevUpMultiplier = prevMultipliers ? Number((prevMultipliers as any)[0] || 0n) / 10000 : 0;
  const prevDownMultiplier = prevMultipliers ? Number((prevMultipliers as any)[1] || 0n) / 10000 : 0;

  // Time Calculation details for Active Round
  const lockTimestamp = activeRound ? Number(activeRound.lockTimestamp) : 0;
  const endTimestamp = activeRound ? Number(activeRound.endTimestamp) : 0;

  const timeLeftToLock = lockTimestamp > 0 ? Math.max(0, lockTimestamp - now) : 0;
  const timeLeftToEnd = endTimestamp > 0 ? Math.max(0, endTimestamp - now) : 0;

  // Time Calculation details for Previous Round
  const prevLockTimestamp = prevRound ? Number(prevRound.lockTimestamp) : 0;
  const prevEndTimestamp = prevRound ? Number(prevRound.endTimestamp) : 0;

  const prevTimeLeftToLock = prevLockTimestamp > 0 ? Math.max(0, prevLockTimestamp - now) : 0;
  const prevTimeLeftToEnd = prevEndTimestamp > 0 ? Math.max(0, prevEndTimestamp - now) : 0;

  // Derived marketStatus
  let marketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS' = 'AWAITING PLAYERS';

  if (activeRoundId === 0n) {
    marketStatus = 'AWAITING PLAYERS';
  } else if (!activeRound) {
    marketStatus = 'OPEN'; // Fallback to OPEN while loading round metadata
  } else if (activeRound.resolved || activeRound.canceled) {
    marketStatus = 'NEXT ROUND';
  } else if (timeLeftToLock > 0) {
    marketStatus = 'OPEN';
  } else if (timeLeftToEnd > 0) {
    marketStatus = 'LOCKED';
  } else {
    marketStatus = 'SETTLING';
  }

  // Derived prevMarketStatus
  let prevMarketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS' = 'AWAITING PLAYERS';

  if (prevRoundId === 0n) {
    prevMarketStatus = 'AWAITING PLAYERS';
  } else if (!prevRound) {
    prevMarketStatus = 'LOCKED'; // Fallback to LOCKED while loading previous round metadata
  } else if (prevRound.resolved || prevRound.canceled) {
    prevMarketStatus = 'NEXT ROUND';
  } else if (prevTimeLeftToLock > 0) {
    prevMarketStatus = 'OPEN';
  } else if (prevTimeLeftToEnd > 0) {
    prevMarketStatus = 'LOCKED';
  } else {
    prevMarketStatus = 'SETTLING';
  }

  // ── Toast overlay API ───────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);

  const triggerToast = (message: string, submessage?: string, type: 'success' | 'info' | 'error' | 'win' | 'loss' | 'refund' = 'success') => {
    setToast({ show: true, message, submessage, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ── Result Auto-check logic ─────────────────────────────────────────────
  const lastNotifiedRoundId = useRef<bigint>(0n);

  useEffect(() => {
    if (!prevRound || !prevRound.resolved || !prevUserBet || prevUserBet.amount === 0n) return;
    if (prevRound.roundId <= lastNotifiedRoundId.current) return;

    lastNotifiedRoundId.current = prevRound.roundId;

    const upWins = prevRound.closePrice > prevRound.startPrice;
    const downWins = prevRound.closePrice < prevRound.startPrice;
    const isUp = prevUserBet.position === 0;

    if (prevRound.canceled) {
      triggerToast('Round Refunded', 'Stake Returned', 'refund');
    } else {
      const won = (upWins && isUp) || (downWins && !isUp);
      if (won) {
        const winningMultiplier = isUp ? prevUpMultiplier : prevDownMultiplier;
        const rewardMultiplier = winningMultiplier > 0 ? winningMultiplier : 1.9;
        const profit = (Number(prevUserBet.amount) / 1e18) * (rewardMultiplier - 1);
        triggerToast('🎉 Prediction Won', `Profit: +${profit.toFixed(4)} ${balanceSymbol}`, 'win');
      } else {
        triggerToast('Prediction Lost', 'Better luck next round.', 'loss');
      }
    }
  }, [prevRoundId, prevRound?.resolved, prevUserBet?.amount]);

  // Capture lock price immediately when the round enters locked status
  const [lockedEntryPrice, setLockedEntryPrice] = useState<number>(0);

  useEffect(() => {
    const isCurrentRoundClosed = marketStatus === 'LOCKED' || marketStatus === 'SETTLING';
    if (isCurrentRoundClosed) {
      if (lockedEntryPrice === 0 && btcPrice > 0) {
        setLockedEntryPrice(btcPrice);
      }
    } else {
      setLockedEntryPrice(0);
    }
  }, [marketStatus, btcPrice, lockedEntryPrice]);

  const value: MarketState = {
    btcPrice,
    twap,
    now,
    walletBalance,
    balanceSymbol,
    currentRoundId,
    activeRound,
    activeMultipliers,
    activeUserBet,
    prevRoundId,
    prevRound,
    prevMultipliers,
    prevUserBet,
    isClaimable,
    activeTotalPool,
    activeUpPercent,
    activeDownPercent,
    activeUpMultiplier,
    activeDownMultiplier,
    prevTotalPool,
    prevUpPercent,
    prevDownPercent,
    prevUpMultiplier,
    prevDownMultiplier,
    timeLeftToLock,
    timeLeftToEnd,
    marketStatus,
    prevTimeLeftToLock,
    prevTimeLeftToEnd,
    prevMarketStatus,
    toast,
    triggerToast,
    lockedEntryPrice,
  };

  return (
    <MarketContext.Provider value={value}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          padding: '14px 18px',
          color: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 260,
          maxWidth: 320,
          animation: 'toastFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontFamily: 'var(--font-sans)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
            {toast.message}
          </div>
          {toast.submessage && (
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>
              {toast.submessage}
            </div>
          )}
          <style>{`
            @keyframes toastFadeIn {
              from { opacity: 0; transform: translateY(12px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
