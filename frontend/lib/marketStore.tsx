'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
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

  // Global Time Status
  timeLeftToLock: number;
  timeLeftToEnd: number;
  marketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS';

  // Toast API
  toast: Toast | null;
  triggerToast: (message: string, submessage?: string, type?: 'success' | 'info' | 'error' | 'win' | 'loss' | 'refund') => void;
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

  // ── 2. Live Binance Price Feed & TWAP ─────────────────────────────────────
  const [btcPrice, setBtcPrice] = useState(64000.0);
  const [twap, setTwap] = useState(64000.0);
  const priceBuffer = useRef<number[]>([]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const data = await res.json();
        if (data && data.price) {
          const currentPrice = parseFloat(data.price);
          setBtcPrice(currentPrice);

          // Update 5-second TWAP buffer
          priceBuffer.current.push(currentPrice);
          if (priceBuffer.current.length > 5) {
            priceBuffer.current.shift();
          }
          const sum = priceBuffer.current.reduce((a, b) => a + b, 0);
          setTwap(sum / priceBuffer.current.length);
        }
      } catch (err) {
        console.error('Error fetching Binance price:', err);
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
    query: { refetchInterval: 2000 },
  });
  const currentRoundId = rawCurrentRoundId ? BigInt(rawCurrentRoundId.toString()) : 0n;

  const activeRoundId = currentRoundId;
  const prevRoundId = activeRoundId > 1n ? activeRoundId - 1n : 0n;

  // (b) Active Round Data
  const { data: rawActiveRound } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });
  const activeRound = rawActiveRound as unknown as RoundData | undefined;

  // (c) Active Round Multipliers
  const { data: activeMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });

  // (d) Active User Bet
  const { data: rawActiveUserBet } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [activeRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: activeRoundId > 0n && !!address, refetchInterval: 2000 },
  });
  const activeUserBet = rawActiveUserBet as unknown as UserBet | undefined;

  // (e) Previous Round Data
  const { data: rawPrevRound } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2500 },
  });
  const prevRound = rawPrevRound as unknown as RoundData | undefined;

  // (f) Previous Round Multipliers
  const { data: prevMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2500 },
  });

  // (g) Previous User Bet
  const { data: rawPrevUserBet } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2500 },
  });
  const prevUserBet = rawPrevUserBet as unknown as UserBet | undefined;

  // (h) Previous Round Claimable Status
  const { data: rawIsClaimable } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2500 },
  });
  const isClaimable = !!rawIsClaimable;

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

  // Time Calculation details
  const lockTimestamp = activeRound ? Number(activeRound.lockTimestamp) : 0;
  const endTimestamp = activeRound ? Number(activeRound.endTimestamp) : 0;

  const timeLeftToLock = lockTimestamp > 0 ? Math.max(0, lockTimestamp - now) : 0;
  const timeLeftToEnd = endTimestamp > 0 ? Math.max(0, endTimestamp - now) : 0;

  // Derived marketStatus
  let marketStatus: 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS' = 'AWAITING PLAYERS';

  if (activeRoundId === 0n) {
    marketStatus = 'AWAITING PLAYERS';
  } else if (activeRound?.resolved || activeRound?.canceled) {
    marketStatus = 'NEXT ROUND';
  } else if (timeLeftToLock > 0) {
    marketStatus = 'OPEN';
  } else if (timeLeftToEnd > 0) {
    marketStatus = 'LOCKED';
  } else {
    marketStatus = 'SETTLING';
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
    toast,
    triggerToast,
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
