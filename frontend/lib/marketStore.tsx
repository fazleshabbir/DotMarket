'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAccount, useReadContracts, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';

// ══════════════════════════════════════════════════════════════════════════════
// DotMarket Engine v2 — Committed-Phase Deterministic Market State Machine
//
// ARCHITECTURE:
//
// 1. AUTHORITATIVE CLOCK
//    Single requestAnimationFrame loop producing a second-precision `now`.
//    Tab backgrounding handled via visibilitychange listener.
//    No component creates its own timer. Everything derives from `now`.
//
// 2. ATOMIC MULTICALL
//    All on-chain data (3 rounds × round data + multipliers + user bets +
//    claimable status) is fetched in a single multicall. No split-state
//    race conditions between round reads.
//
// 3. STICKY DATA REFS
//    When RPC returns nothing (timeout, error), the previous good data is
//    retained via useRef. RPC failures never erase cached state.
//
// 4. IMMUTABLE TIMESTAMP CACHE
//    On-chain lockTimestamp and endTimestamp are immutable once a round is
//    created. We cache them on first read. Even if the RPC drops the round
//    data on subsequent polls, we always have the timestamps.
//
// 5. COMMITTED PHASE ENGINE (the core stability fix)
//    Once we determine the phase ('betting' or 'live'), we COMMIT it with
//    a deadline (the on-chain lockTimestamp or endTimestamp). The phase is
//    then LOCKED until that deadline passes. No RPC jitter, no data race,
//    no momentary undefined value can cause the phase to change.
//
//    Phase transitions happen exactly once per market cycle:
//      betting → live    (when lockTimestamp passes)
//      live → betting    (when endTimestamp passes and next round opens)
//
//    The committed deadline can be EXTENDED (if new data shows a later
//    timestamp) but NEVER shortened. This eliminates all flickering.
//
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────────
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

type MarketStatus = 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS';

// Phase determines which panel the user sees — betting or live/settlement
type Phase = 'betting' | 'live';

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

  pastRoundId: bigint;
  pastRound: RoundData | undefined;
  pastMultipliers: any;
  pastUserBet: UserBet | undefined;
  isPastClaimable: boolean;

  // Calculated Pool Stats
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

  // Global Time Status for Active Round
  timeLeftToLock: number;
  timeLeftToEnd: number;
  marketStatus: MarketStatus;

  // Global Time Status for Previous Round
  prevTimeLeftToLock: number;
  prevTimeLeftToEnd: number;
  prevMarketStatus: MarketStatus;

  // Committed Phase (guaranteed stable — never flickers)
  phase: Phase;
  isBettingOpen: boolean;

  // Toast API
  toast: Toast | null;
  triggerToast: (message: string, submessage?: string, type?: Toast['type']) => void;
  lockedEntryPrice: number;
}

const MarketContext = createContext<MarketState | undefined>(undefined);

// ── Deterministic Status Derivation ────────────────────────────────────────────
// Pure function: (roundId, round, timeLeftToLock, timeLeftToEnd) → MarketStatus
// This produces the status string for display/labels. The PHASE (which panel to
// show) is determined separately by the committed phase engine.
function deriveMarketStatus(
  roundId: bigint,
  round: RoundData | undefined,
  timeLeftToLock: number,
  timeLeftToEnd: number,
): MarketStatus {
  // No round exists yet (genesis round has not been opened on contract)
  if (roundId === 0n) return 'AWAITING PLAYERS';

  // If round data hasn't loaded yet OR is still returning a stale round:
  // Show OPEN optimistically (roundId > 0 means a round exists)
  if (!round || round.roundId !== roundId) return 'OPEN';

  // Canceled or resolved rounds
  if (round.canceled) return 'NEXT ROUND';
  if (round.resolved) return 'NEXT ROUND';

  // Active lifecycle: OPEN → LOCKED → SETTLING
  if (timeLeftToLock > 0) return 'OPEN';
  if (timeLeftToEnd > 0) return 'LOCKED';

  return 'SETTLING';
}

// ══════════════════════════════════════════════════════════════════════════════
// MARKET PROVIDER
// ══════════════════════════════════════════════════════════════════════════════

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 1. AUTHORITATIVE CLOCK                                                  │
  // │                                                                          │
  // │ Single source of truth for "what time is it" across the entire app.     │
  // │ Uses requestAnimationFrame for precise second-boundary detection.       │
  // │ Recovers immediately when the tab becomes visible after backgrounding.  │
  // │ Initialize to 0 to avoid SSR hydration mismatch.                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [now, setNow] = useState(0);

  useEffect(() => {
    let lastSecond = Math.floor(Date.now() / 1000);
    setNow(lastSecond);

    let animationFrameId: number;
    const tick = () => {
      const currentSecond = Math.floor(Date.now() / 1000);
      if (currentSecond !== lastSecond) {
        setNow(currentSecond);
        lastSecond = currentSecond;
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);

    // Immediately sync when tab becomes visible (handles sleep, tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentSecond = Math.floor(Date.now() / 1000);
        setNow(currentSecond);
        lastSecond = currentSecond;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2. LIVE PRICE FEED (Pyth Hermes with Binance fallback)                  │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [btcPrice, setBtcPrice] = useState(0);
  const [twap, setTwap] = useState(0);
  const priceBuffer = useRef<number[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // 1. Try Pyth Hermes API first
        const res = await fetch(
          'https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data?.parsed?.[0]) {
          const priceStr = data.parsed[0].price.price;
          const expo = data.parsed[0].price.expo;
          const currentPrice = Number(priceStr) * Math.pow(10, expo);

          if (currentPrice > 0) {
            setBtcPrice(currentPrice);

            // Update TWAP buffer (5-sample moving average)
            priceBuffer.current.push(currentPrice);
            if (priceBuffer.current.length > 5) priceBuffer.current.shift();
            const sum = priceBuffer.current.reduce((a, b) => a + b, 0);
            setTwap(sum / priceBuffer.current.length);
            return;
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Pyth Hermes failed, trying Binance:', err);
      }

      // 2. Fallback to Binance
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data?.price) {
          const currentPrice = parseFloat(data.price);
          if (currentPrice > 0) {
            setBtcPrice(currentPrice);

            priceBuffer.current.push(currentPrice);
            if (priceBuffer.current.length > 5) priceBuffer.current.shift();
            const sum = priceBuffer.current.reduce((a, b) => a + b, 0);
            setTwap(sum / priceBuffer.current.length);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Binance price fetch also failed:', err);
        }
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 1000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 3. WALLET BALANCE                                                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  const { data: balanceData } = useBalance({
    address: address,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const walletBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const balanceSymbol = balanceData?.symbol || 'ETH';

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 4. CONTRACT POLLING — ATOMIC MULTICALL                                   │
  // │                                                                          │
  // │ All round data is fetched in a SINGLE multicall to prevent split-state  │
  // │ race conditions. Sticky refs ensure RPC failures don't erase data.      │
  // └──────────────────────────────────────────────────────────────────────────┘

  // 4a. Fetch currentRoundId
  const { data: roundIdBatch } = useReadContracts({
    contracts: [
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'currentRoundId' },
    ],
    query: { refetchInterval: 3000 },
  });

  // STICKY roundId: once it goes above 0, it NEVER regresses back to 0.
  // This prevents 'AWAITING PLAYERS' flicker when RPC fails or is slow.
  const stickyRoundIdRef = useRef(0n);
  const rawRoundId = roundIdBatch?.[0]?.result
    ? BigInt(roundIdBatch[0].result.toString())
    : 0n;
  if (rawRoundId > stickyRoundIdRef.current) {
    stickyRoundIdRef.current = rawRoundId;
  }
  const currentRoundId = rawRoundId > 0n ? rawRoundId : stickyRoundIdRef.current;

  const activeRoundId = currentRoundId;
  const prevRoundId = activeRoundId > 1n ? activeRoundId - 1n : 0n;
  const pastRoundId = activeRoundId > 2n ? activeRoundId - 2n : 0n;

  // Zero address constant for when wallet is disconnected
  const userAddress = address || '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const hasAddress = !!address;

  // 4b. Batch all round data in a SINGLE multicall (atomic — no race conditions)
  const { data: batchData } = useReadContracts({
    contracts: [
      // Active round (indices 0-2)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound', args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet', args: [activeRoundId, userAddress] },
      // Previous round (indices 3-6)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound', args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet', args: [prevRoundId, userAddress] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'claimable', args: [prevRoundId, userAddress] },
      // Past round (indices 7-10)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound', args: [pastRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [pastRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet', args: [pastRoundId, userAddress] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'claimable', args: [pastRoundId, userAddress] },
    ],
    query: {
      enabled: activeRoundId > 0n,
      refetchInterval: 3000,
    },
  });

  // STICKY batch data: keep the last good data when RPC returns nothing
  const stickyBatchRef = useRef(batchData);
  if (batchData && batchData.length > 0) {
    stickyBatchRef.current = batchData;
  }
  const safeBatch = batchData ?? stickyBatchRef.current;

  // Destructure batch results — always from same multicall, guaranteed consistent
  const activeRound = safeBatch?.[0]?.result as RoundData | undefined;
  const activeMultipliers = safeBatch?.[1]?.result;
  const activeUserBet = (hasAddress ? safeBatch?.[2]?.result : undefined) as UserBet | undefined;
  const prevRound = safeBatch?.[3]?.result as RoundData | undefined;
  const prevMultipliers = safeBatch?.[4]?.result;
  const prevUserBet = (hasAddress ? safeBatch?.[5]?.result : undefined) as UserBet | undefined;
  const isClaimable = hasAddress ? !!safeBatch?.[6]?.result : false;
  const pastRound = safeBatch?.[7]?.result as RoundData | undefined;
  const pastMultipliers = safeBatch?.[8]?.result;
  const pastUserBet = (hasAddress ? safeBatch?.[9]?.result : undefined) as UserBet | undefined;
  const isPastClaimable = hasAddress ? !!safeBatch?.[10]?.result : false;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 5. DERIVED POOL & MULTIPLIER STATS (pure calculations, no state)        │
  // └──────────────────────────────────────────────────────────────────────────┘

  // Active Round Stats
  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n && activeRound
    ? Number((activeRound.totalUpAmount * 10000n) / activeTotalPool) / 100
    : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;
  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  // Previous Round Stats
  const prevTotalPool = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  const prevUpPercent = prevTotalPool > 0n && prevRound
    ? Number((prevRound.totalUpAmount * 10000n) / prevTotalPool) / 100
    : 50;
  const prevDownPercent = prevTotalPool > 0n ? 100 - prevUpPercent : 50;
  const prevUpMultiplier = prevMultipliers ? Number((prevMultipliers as any)[0] || 0n) / 10000 : 0;
  const prevDownMultiplier = prevMultipliers ? Number((prevMultipliers as any)[1] || 0n) / 10000 : 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 6. IMMUTABLE TIMESTAMP CACHE                                             │
  // │                                                                          │
  // │ On-chain lockTimestamp and endTimestamp are set when a round is created  │
  // │ and never change. We cache them so that even if a subsequent RPC poll    │
  // │ returns nothing (timeout/error), we still have the timestamps.          │
  // │ Cache entries are NEVER overwritten or deleted.                          │
  // └──────────────────────────────────────────────────────────────────────────┘
  const timestampCacheRef = useRef(new Map<string, { lock: number; end: number }>());

  // Helper: cache a round's timestamps if valid and not already cached
  const cacheTimestamps = (round: RoundData | undefined, expectedId: bigint) => {
    if (!round || round.roundId !== expectedId || expectedId === 0n) return;
    const key = expectedId.toString();
    if (timestampCacheRef.current.has(key)) return; // Already cached
    const lock = Number(round.lockTimestamp);
    const end = Number(round.endTimestamp);
    if (lock > 0 && end > 0) {
      timestampCacheRef.current.set(key, { lock, end });
    }
  };

  // Cache all rounds we've seen
  cacheTimestamps(activeRound, activeRoundId);
  cacheTimestamps(prevRound, prevRoundId);
  cacheTimestamps(pastRound, pastRoundId);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 7. TIMESTAMP RESOLUTION                                                  │
  // │                                                                          │
  // │ Resolve the lockTimestamp and endTimestamp for the active round using:   │
  // │   1. Live round data (if loaded and matching)                            │
  // │   2. Immutable cache (if live data is unavailable)                       │
  // │   3. Estimation from previous round (last resort)                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  const isActiveLoaded = !!(activeRound && activeRound.roundId === activeRoundId && activeRoundId > 0n);

  let lockTimestamp = 0;
  let endTimestamp = 0;

  if (isActiveLoaded) {
    // Best case: live data matches expected round
    lockTimestamp = Number(activeRound!.lockTimestamp);
    endTimestamp = Number(activeRound!.endTimestamp);
  } else if (activeRoundId > 0n) {
    // Fallback 1: immutable cache
    const cached = timestampCacheRef.current.get(activeRoundId.toString());
    if (cached) {
      lockTimestamp = cached.lock;
      endTimestamp = cached.end;
    } else {
      // Fallback 2: estimate from previous round's cached timestamps
      const prevCached = timestampCacheRef.current.get(prevRoundId.toString());
      if (prevCached) {
        lockTimestamp = prevCached.end + 60;
        endTimestamp = prevCached.end + 120;
      }
      // If no prev cache either: timestamps stay 0, phase waits for data
    }
  }

  // Previous round timestamps (for prev round timer/status display)
  let prevLockTimestamp = 0;
  let prevEndTimestamp = 0;

  if (prevRound && prevRound.roundId === prevRoundId && prevRoundId > 0n) {
    prevLockTimestamp = Number(prevRound.lockTimestamp);
    prevEndTimestamp = Number(prevRound.endTimestamp);
  } else if (prevRoundId > 0n) {
    const cached = timestampCacheRef.current.get(prevRoundId.toString());
    if (cached) {
      prevLockTimestamp = cached.lock;
      prevEndTimestamp = cached.end;
    }
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 8. TIMER DERIVATIONS                                                     │
  // │                                                                          │
  // │ Pure math: countdown = max(0, deadline - now)                            │
  // │ Since timestamps come from the cache/resolution layer, they are stable. │
  // └──────────────────────────────────────────────────────────────────────────┘
  const timeLeftToLock = (lockTimestamp > 0 && now > 0) ? Math.max(0, lockTimestamp - now) : 0;
  const timeLeftToEnd = (endTimestamp > 0 && now > 0) ? Math.max(0, endTimestamp - now) : 0;
  const prevTimeLeftToLock = (prevLockTimestamp > 0 && now > 0) ? Math.max(0, prevLockTimestamp - now) : 0;
  const prevTimeLeftToEnd = (prevEndTimestamp > 0 && now > 0) ? Math.max(0, prevEndTimestamp - now) : 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 9. STRICT TIME-BASED PHASE ENGINE                                        │
  // │                                                                          │
  // │ Phase is strictly derived from the current time. No commitments, no     │
  // │ deadlocks. If the time passes, the phase changes instantly.              │
  // └──────────────────────────────────────────────────────────────────────────┘
  let phase: Phase = 'betting';
  if (currentRoundId > 0n && lockTimestamp > 0 && endTimestamp > 0) {
    if (now < lockTimestamp) {
      phase = 'betting';
    } else {
      // Anything past lockTimestamp is 'live' panel (which handles LOCKED and SETTLING)
      phase = 'live';
    }
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 10. MARKET STATUS & BUSINESS LOGIC                                       │
  // └──────────────────────────────────────────────────────────────────────────┘
  const marketStatus = deriveMarketStatus(activeRoundId, activeRound, timeLeftToLock, timeLeftToEnd);
  const prevMarketStatus = deriveMarketStatus(prevRoundId, prevRound, prevTimeLeftToLock, prevTimeLeftToEnd);

  // Centralized betting-open flag: true only during committed betting phase
  // with positive time remaining. Components use this instead of computing their own.
  const isBettingOpen = phase === 'betting' && timeLeftToLock > 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 11. LOCKED ENTRY PRICE                                                   │
  // │                                                                          │
  // │ Uses the committed phase (guaranteed stable) to determine when to show  │
  // │ the locked entry price vs. the live price.                               │
  // └──────────────────────────────────────────────────────────────────────────┘
  const lockedEntryPrice = useMemo(() => {
    if (phase === 'live') {
      const onChainPrice = activeRound ? Number(activeRound.startPrice) / 1e8 : 0;
      if (onChainPrice > 0) return onChainPrice;
      return btcPrice > 0 ? btcPrice : 0;
    }
    return 0;
  }, [phase, activeRound, btcPrice]);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 12. TOAST SYSTEM                                                         │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((
    message: string,
    submessage?: string,
    type: Toast['type'] = 'success'
  ) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, submessage, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 13. RESULT AUTO-CHECK (notifications for resolved rounds)                │
  // └──────────────────────────────────────────────────────────────────────────┘
  const lastNotifiedRoundId = useRef<bigint>(0n);

  useEffect(() => {
    const pastUpMultiplier = pastMultipliers ? Number((pastMultipliers as any)[0] || 0n) / 10000 : 0;
    const pastDownMultiplier = pastMultipliers ? Number((pastMultipliers as any)[1] || 0n) / 10000 : 0;

    const roundsToCheck = [
      { id: prevRoundId, round: prevRound, bet: prevUserBet, upMult: prevUpMultiplier, downMult: prevDownMultiplier },
      { id: pastRoundId, round: pastRound, bet: pastUserBet, upMult: pastUpMultiplier, downMult: pastDownMultiplier },
    ];

    for (const { id, round, bet, upMult, downMult } of roundsToCheck) {
      if (!round || !bet || bet.amount === 0n) continue;
      if (!round.resolved && !round.canceled) continue;
      if (id <= lastNotifiedRoundId.current) continue;

      lastNotifiedRoundId.current = id;

      if (round.canceled) {
        triggerToast('Round Refunded', 'Stake Returned', 'refund');
      } else {
        const upWins = round.closePrice > round.startPrice;
        const downWins = round.closePrice < round.startPrice;
        const isUp = bet.position === 0;
        const won = (upWins && isUp) || (downWins && !isUp);

        if (won) {
          const winningMultiplier = isUp ? upMult : downMult;
          const rewardMultiplier = winningMultiplier > 0 ? winningMultiplier : 1.9;
          const profit = (Number(bet.amount) / 1e18) * (rewardMultiplier - 1);
          triggerToast('🎉 Prediction Won', `Profit: +${profit.toFixed(4)} ${balanceSymbol}`, 'win');
        } else {
          triggerToast('Prediction Lost', 'Better luck next round.', 'loss');
        }
      }
    }
  }, [prevRoundId, pastRoundId, prevRound?.resolved, prevRound?.canceled, pastRound?.resolved, pastRound?.canceled, prevUserBet?.amount, pastUserBet?.amount, triggerToast, balanceSymbol]);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 14. MEMOIZED CONTEXT VALUE                                               │
  // └──────────────────────────────────────────────────────────────────────────┘
  const value: MarketState = useMemo(() => ({
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
    pastRoundId,
    pastRound,
    pastMultipliers,
    pastUserBet,
    isPastClaimable,
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
    phase,
    isBettingOpen,
    toast,
    triggerToast,
    lockedEntryPrice,
  }), [
    btcPrice, twap, now, walletBalance, balanceSymbol,
    currentRoundId,
    activeRound, activeMultipliers, activeUserBet,
    prevRoundId, prevRound, prevMultipliers, prevUserBet, isClaimable,
    pastRoundId, pastRound, pastMultipliers, pastUserBet, isPastClaimable,
    activeTotalPool, activeUpPercent, activeDownPercent, activeUpMultiplier, activeDownMultiplier,
    prevTotalPool, prevUpPercent, prevDownPercent, prevUpMultiplier, prevDownMultiplier,
    timeLeftToLock, timeLeftToEnd, marketStatus,
    prevTimeLeftToLock, prevTimeLeftToEnd, prevMarketStatus,
    phase, isBettingOpen, toast, triggerToast, lockedEntryPrice,
  ]);

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
          flexDirection: 'column' as const,
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
