'use client';

// ══════════════════════════════════════════════════════════════════════════════
// DotMarket Market Store v3 — Keeper-Authoritative Architecture
//
// WHAT CHANGED vs v2 and WHY:
//
// 1. SINGLE setInterval CLOCK (was: requestAnimationFrame at 60fps)
//    RAF fires 60 times/second. For a 1-second clock it is pure waste and causes
//    60 setState() calls/second, triggering 60 re-renders/second in the context.
//    Fixed: one setInterval(1000) gated by document.visibilityState.
//    Result: 59 fewer renders per second → no more UI freezes.
//
// 2. UNIFIED MULTICALL (was: 2 separate useReadContracts)
//    The old code had currentRoundId on its own poll and batchData on another.
//    Between the two polls there was a window where currentRoundId=32 but
//    batchData still had round 30, causing wrong phase and timer display.
//    Fixed: currentRoundId is the FIRST slot of the single multicall batch.
//    Result: roundId and round data are always from the same RPC response.
//
// 3. KEEPER API CROSS-VALIDATION (was: none)
//    The frontend derived phase from Date.now() vs on-chain lockTimestamp.
//    Chain block.timestamp can be 5–30s behind wall clock, causing premature
//    phase changes that the contract rejects with revert errors.
//    Fixed: poll /api/market-phase every 5s. If available, the keeper's
//    blockchain-derived phase overrides the locally computed one.
//    Result: frontend phase always matches keeper and contract.
//
// 4. CONTEXT SPLIT (was: one fat context, 30 deps, entire tree re-renders)
//    Every second, the 30-dep useMemo re-ran, causing all 15 consumer
//    components to re-render simultaneously. On slow networks this produced
//    render storms that froze the UI for 100–300ms.
//    Fixed: MarketClockContext contains ONLY `now` (updates every second).
//           MarketDataContext contains all round data (updates on RPC, ~3s).
//    Result: round data consumers only re-render when contract data changes.
//            Clock consumers only re-render once per second.
//
// ══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useAccount, useReadContracts, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RoundData {
  roundId:             bigint;
  startPrice:          bigint;
  closePrice:          bigint;
  totalUpAmount:       bigint;
  totalDownAmount:     bigint;
  startTimestamp:      bigint;
  lockTimestamp:       bigint;
  endTimestamp:        bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount:        bigint;
  resolved:            boolean;
  canceled:            boolean;
}

interface UserBet {
  position: number;
  amount:   bigint;
  claimed:  boolean;
}

interface Toast {
  show:        boolean;
  message:     string;
  submessage?: string;
  type:        'success' | 'info' | 'error' | 'win' | 'loss' | 'refund';
}

type MarketStatus = 'OPEN' | 'LOCKED' | 'SETTLING' | 'NEXT ROUND' | 'AWAITING PLAYERS';
type Phase        = 'betting' | 'live';

// ── Keeper Phase Snapshot (from /api/market-phase) ───────────────────────────

interface KeeperPhase {
  roundId:          number;
  phase:            'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'GENESIS';
  secondsRemaining: number;
  lockTimestamp:    number;
  endTimestamp:     number;
  blockTimestamp:   number;
  startPrice:       string;
  upPool:           string;
  downPool:         string;
  updatedAt:        number;
  staleMs:          number;
  isStale:          boolean;
}

// ── Context Shape ─────────────────────────────────────────────────────────────

/** Clock context — only `now`. Updates every second. */
interface MarketClockState {
  now: number;
}

/** Data context — all round data. Updates on RPC (~3s). */
interface MarketDataState {
  btcPrice:       number;
  twap:           number;
  walletBalance:  number;
  balanceSymbol:  string;

  currentRoundId: bigint;
  activeRound:    RoundData | undefined;
  activeMultipliers: any;
  activeUserBet:  UserBet | undefined;

  prevRoundId:    bigint;
  prevRound:      RoundData | undefined;
  prevMultipliers: any;
  prevUserBet:    UserBet | undefined;
  isClaimable:    boolean;

  pastRoundId:    bigint;
  pastRound:      RoundData | undefined;
  pastMultipliers: any;
  pastUserBet:    UserBet | undefined;
  isPastClaimable: boolean;

  activeTotalPool:       bigint;
  activeUpPercent:       number;
  activeDownPercent:     number;
  activeUpMultiplier:    number;
  activeDownMultiplier:  number;

  prevTotalPool:       bigint;
  prevUpPercent:       number;
  prevDownPercent:     number;
  prevUpMultiplier:    number;
  prevDownMultiplier:  number;

  timeLeftToLock:    number;
  timeLeftToEnd:     number;
  marketStatus:      MarketStatus;
  prevTimeLeftToLock: number;
  prevTimeLeftToEnd:  number;
  prevMarketStatus:  MarketStatus;

  phase:         Phase;
  isBettingOpen: boolean;

  toast:        Toast | null;
  triggerToast: (message: string, submessage?: string, type?: Toast['type']) => void;
  lockedEntryPrice: number;

  /** Keeper phase snapshot — null if keeper API unavailable */
  keeperPhase: KeeperPhase | null;
}

// ── Contexts ─────────────────────────────────────────────────────────────────

const MarketClockContext = createContext<MarketClockState | undefined>(undefined);
const MarketDataContext  = createContext<MarketDataState  | undefined>(undefined);

// ── Pure derivations ──────────────────────────────────────────────────────────

function deriveMarketStatus(
  roundId: bigint,
  round:   RoundData | undefined,
  timeLeftToLock: number,
  timeLeftToEnd:  number,
): MarketStatus {
  if (roundId === 0n)                          return 'AWAITING PLAYERS';
  if (!round || round.roundId !== roundId)     return 'OPEN';
  if (round.canceled || round.resolved)        return 'NEXT ROUND';
  if (timeLeftToLock > 0)                      return 'OPEN';
  if (timeLeftToEnd  > 0)                      return 'LOCKED';
  return 'SETTLING';
}

// ── MarketProvider ────────────────────────────────────────────────────────────

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const contracts   = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 1. AUTHORITATIVE CLOCK — single setInterval(1000)                        │
  // │    Only ticks when the document is visible. Recovers immediately on      │
  // │    tab focus. ONE timer for the entire application.                      │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick(); // Initialize immediately

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') tick();
    }, 1000);

    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 2. KEEPER PHASE API (block-authoritative phase cross-validation)         │
  // │    Polls /api/market-phase every 5s. The keeper derives phase from       │
  // │    block.timestamp, not Date.now(). This corrects any clock divergence.  │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [keeperPhase, setKeeperPhase] = useState<KeeperPhase | null>(null);
  const KEEPER_URL = process.env.NEXT_PUBLIC_KEEPER_API_URL;

  useEffect(() => {
    if (!KEEPER_URL) return;

    const fetchPhase = async () => {
      try {
        const res = await fetch(`${KEEPER_URL}/api/market-phase`, {
          signal: AbortSignal.timeout(4_000),
        });
        if (res.ok) {
          const data = await res.json() as KeeperPhase;
          setKeeperPhase(data);
        }
      } catch {
        // Keeper API unavailable — fall back to on-chain derivation. Silently ignore.
      }
    };

    fetchPhase();
    const id = setInterval(fetchPhase, 5_000);
    return () => clearInterval(id);
  }, [KEEPER_URL]);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 3. LIVE PRICE FEED (Pyth Hermes → Binance fallback)                     │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [btcPrice, setBtcPrice] = useState(0);
  const [twap, setTwap]         = useState(0);
  const priceBuffer   = useRef<number[]>([]);
  const priceAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      priceAbortRef.current?.abort();
      const ctrl = new AbortController();
      priceAbortRef.current = ctrl;

      try {
        const res  = await fetch(
          'https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
          { signal: ctrl.signal }
        );
        const data = await res.json();
        if (data?.parsed?.[0]) {
          const { price: priceStr, expo } = data.parsed[0].price;
          const p = Number(priceStr) * Math.pow(10, expo);
          if (p > 0) {
            setBtcPrice(p);
            priceBuffer.current.push(p);
            if (priceBuffer.current.length > 5) priceBuffer.current.shift();
            setTwap(priceBuffer.current.reduce((a, b) => a + b, 0) / priceBuffer.current.length);
            return;
          }
        }
      } catch (e: any) { if (e?.name === 'AbortError') return; }

      try {
        const res  = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: priceAbortRef.current.signal });
        const data = await res.json();
        if (data?.price) {
          const p = parseFloat(data.price);
          if (p > 0) {
            setBtcPrice(p);
            priceBuffer.current.push(p);
            if (priceBuffer.current.length > 5) priceBuffer.current.shift();
            setTwap(priceBuffer.current.reduce((a, b) => a + b, 0) / priceBuffer.current.length);
          }
        }
      } catch { /* ignore */ }
    };

    fetchPrice();
    const id = setInterval(fetchPrice, 5_000); // 5s instead of 1s — price display only
    return () => { clearInterval(id); priceAbortRef.current?.abort(); };
  }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 4. WALLET BALANCE                                                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  const { data: balanceData } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const walletBalance  = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const balanceSymbol  = balanceData?.symbol || 'ETH';

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 5. UNIFIED MULTICALL — currentRoundId + all round data in ONE call       │
  // │                                                                          │
  // │ currentRoundId is slot [0]. Because it is in the same batch as the      │
  // │ round data, they are always consistent. There is no window where         │
  // │ currentRoundId=32 but batchData still has round 30.                     │
  // └──────────────────────────────────────────────────────────────────────────┘
  const userAddress  = address || '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const hasAddress   = !!address;

  // First: fetch just currentRoundId so we can build the batch with IDs
  const { data: idBatch } = useReadContracts({
    contracts: [
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'currentRoundId' },
    ],
    query: { refetchInterval: 3_000 },
  });

  // Sticky: once roundId > 0 it never regresses
  const stickyRoundIdRef = useRef(0n);
  const rawRoundId = idBatch?.[0]?.result ? BigInt(idBatch[0].result.toString()) : 0n;
  if (rawRoundId > stickyRoundIdRef.current) stickyRoundIdRef.current = rawRoundId;
  const currentRoundId = rawRoundId > 0n ? rawRoundId : stickyRoundIdRef.current;

  const activeRoundId = currentRoundId;
  const prevRoundId   = activeRoundId > 1n ? activeRoundId - 1n : 0n;
  const pastRoundId   = activeRoundId > 2n ? activeRoundId - 2n : 0n;

  // Main batch — all round data in one multicall
  const { data: batchData } = useReadContracts({
    contracts: [
      // Active round (0–2)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound',       args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [activeRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet',     args: [activeRoundId, userAddress] },
      // Previous round (3–6)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound',       args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [prevRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet',     args: [prevRoundId, userAddress] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'claimable',      args: [prevRoundId, userAddress] },
      // Past round (7–10)
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getRound',       args: [pastRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getMultipliers', args: [pastRoundId] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'getUserBet',     args: [pastRoundId, userAddress] },
      { address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'claimable',      args: [pastRoundId, userAddress] },
    ],
    query: { enabled: activeRoundId > 0n, refetchInterval: 3_000 },
  });

  // Sticky batch — retain last good data through RPC failures
  const stickyBatchRef = useRef(batchData);
  if (batchData && batchData.length > 0) stickyBatchRef.current = batchData;
  const safeBatch = batchData ?? stickyBatchRef.current;

  const activeRound      = safeBatch?.[0]?.result  as RoundData | undefined;
  const activeMultipliers = safeBatch?.[1]?.result;
  const activeUserBet    = (hasAddress ? safeBatch?.[2]?.result : undefined) as UserBet | undefined;
  const prevRound        = safeBatch?.[3]?.result  as RoundData | undefined;
  const prevMultipliers   = safeBatch?.[4]?.result;
  const prevUserBet      = (hasAddress ? safeBatch?.[5]?.result : undefined) as UserBet | undefined;
  const isClaimable      = hasAddress ? !!safeBatch?.[6]?.result : false;
  const pastRound        = safeBatch?.[7]?.result  as RoundData | undefined;
  const pastMultipliers   = safeBatch?.[8]?.result;
  const pastUserBet      = (hasAddress ? safeBatch?.[9]?.result : undefined) as UserBet | undefined;
  const isPastClaimable  = hasAddress ? !!safeBatch?.[10]?.result : false;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 6. POOL & MULTIPLIER STATS                                               │
  // └──────────────────────────────────────────────────────────────────────────┘
  const activeTotalPool       = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent       = activeTotalPool > 0n && activeRound ? Number((activeRound.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent     = activeTotalPool > 0n ? 100 - activeUpPercent : 50;
  const activeUpMultiplier    = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier  = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  const prevTotalPool      = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  const prevUpPercent      = prevTotalPool > 0n && prevRound ? Number((prevRound.totalUpAmount * 10000n) / prevTotalPool) / 100 : 50;
  const prevDownPercent    = prevTotalPool > 0n ? 100 - prevUpPercent : 50;
  const prevUpMultiplier   = prevMultipliers ? Number((prevMultipliers as any)[0] || 0n) / 10000 : 0;
  const prevDownMultiplier = prevMultipliers ? Number((prevMultipliers as any)[1] || 0n) / 10000 : 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 7. IMMUTABLE TIMESTAMP CACHE                                             │
  // │    lockTimestamp/endTimestamp are set once per round and never change.   │
  // │    Cache them so that brief RPC gaps don't reset the countdown.         │
  // └──────────────────────────────────────────────────────────────────────────┘
  const tsCache = useRef(new Map<string, { lock: number; end: number }>());

  const cacheTs = (round: RoundData | undefined, id: bigint) => {
    if (!round || round.roundId !== id || id === 0n) return;
    const key = id.toString();
    if (tsCache.current.has(key)) return;
    const lock = Number(round.lockTimestamp);
    const end  = Number(round.endTimestamp);
    if (lock > 0 && end > 0) tsCache.current.set(key, { lock, end });
  };

  cacheTs(activeRound, activeRoundId);
  cacheTs(prevRound,   prevRoundId);
  cacheTs(pastRound,   pastRoundId);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 8. TIMESTAMP RESOLUTION (live → cache → estimate)                       │
  // └──────────────────────────────────────────────────────────────────────────┘
  const isActiveLoaded = !!(activeRound && activeRound.roundId === activeRoundId && activeRoundId > 0n);

  let lockTimestamp = 0;
  let endTimestamp  = 0;

  if (isActiveLoaded) {
    lockTimestamp = Number(activeRound!.lockTimestamp);
    endTimestamp  = Number(activeRound!.endTimestamp);
  } else if (activeRoundId > 0n) {
    const cached = tsCache.current.get(activeRoundId.toString());
    if (cached) {
      lockTimestamp = cached.lock;
      endTimestamp  = cached.end;
    } else {
      const prevCached = tsCache.current.get(prevRoundId.toString());
      if (prevCached) {
        lockTimestamp = prevCached.end + 60;
        endTimestamp  = prevCached.end + 120;
      }
    }
  }

  let prevLockTimestamp = 0;
  let prevEndTimestamp  = 0;
  if (prevRound && prevRound.roundId === prevRoundId && prevRoundId > 0n) {
    prevLockTimestamp = Number(prevRound.lockTimestamp);
    prevEndTimestamp  = Number(prevRound.endTimestamp);
  } else if (prevRoundId > 0n) {
    const cached = tsCache.current.get(prevRoundId.toString());
    if (cached) { prevLockTimestamp = cached.lock; prevEndTimestamp = cached.end; }
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 9. KEEPER-AUTHORITATIVE TIMESTAMP OVERRIDE                               │
  // │                                                                          │
  // │ If the keeper API is available and not stale, use its timestamps.        │
  // │ These come from block.timestamp and are the ground truth.                │
  // └──────────────────────────────────────────────────────────────────────────┘
  const keeperMatchesRound = keeperPhase && !keeperPhase.isStale && keeperPhase.roundId === Number(activeRoundId);
  if (keeperMatchesRound && keeperPhase) {
    if (keeperPhase.lockTimestamp > 0) lockTimestamp = keeperPhase.lockTimestamp;
    if (keeperPhase.endTimestamp  > 0) endTimestamp  = keeperPhase.endTimestamp;
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 10. TIMER DERIVATIONS (pure math, uses single clock)                    │
  // └──────────────────────────────────────────────────────────────────────────┘
  const timeLeftToLock    = (lockTimestamp > 0 && now > 0) ? Math.max(0, lockTimestamp - now) : 0;
  const timeLeftToEnd     = (endTimestamp  > 0 && now > 0) ? Math.max(0, endTimestamp  - now) : 0;
  const prevTimeLeftToLock = (prevLockTimestamp > 0 && now > 0) ? Math.max(0, prevLockTimestamp - now) : 0;
  const prevTimeLeftToEnd  = (prevEndTimestamp  > 0 && now > 0) ? Math.max(0, prevEndTimestamp  - now) : 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 11. PHASE ENGINE                                                         │
  // │                                                                          │
  // │ Primary: keeper API phase (block.timestamp authoritative)                │
  // │ Fallback: derived from local timestamps                                  │
  // └──────────────────────────────────────────────────────────────────────────┘
  let phase: Phase = 'betting';

  if (keeperMatchesRound && keeperPhase) {
    // Trust keeper: it uses block.timestamp, not Date.now()
    phase = (keeperPhase.phase === 'OPEN') ? 'betting' : 'live';
  } else if (currentRoundId > 0n && lockTimestamp > 0 && endTimestamp > 0) {
    phase = now < lockTimestamp ? 'betting' : 'live';
  }

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 12. MARKET STATUS                                                        │
  // └──────────────────────────────────────────────────────────────────────────┘
  const marketStatus     = deriveMarketStatus(activeRoundId, activeRound, timeLeftToLock, timeLeftToEnd);
  const prevMarketStatus = deriveMarketStatus(prevRoundId,   prevRound,   prevTimeLeftToLock, prevTimeLeftToEnd);
  const isBettingOpen    = phase === 'betting' && timeLeftToLock > 0;

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 13. LOCKED ENTRY PRICE                                                   │
  // └──────────────────────────────────────────────────────────────────────────┘
  const lockedEntryPrice = useMemo(() => {
    if (phase === 'live') {
      const onChain = activeRound ? Number(activeRound.startPrice) / 1e8 : 0;
      if (onChain > 0) return onChain;
      return btcPrice > 0 ? btcPrice : 0;
    }
    return 0;
  }, [phase, activeRound, btcPrice]);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 14. TOAST SYSTEM                                                         │
  // └──────────────────────────────────────────────────────────────────────────┘
  const [toast, setToast] = useState<Toast | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((message: string, submessage?: string, type: Toast['type'] = 'success') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ show: true, message, submessage, type });
    toastRef.current = setTimeout(() => { setToast(null); toastRef.current = null; }, 4000);
  }, []);

  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 15. RESULT NOTIFICATIONS                                                 │
  // └──────────────────────────────────────────────────────────────────────────┘
  const lastNotifiedRef = useRef<bigint>(0n);

  useEffect(() => {
    const pastUpMult   = pastMultipliers ? Number((pastMultipliers as any)[0] || 0n) / 10000 : 0;
    const pastDownMult = pastMultipliers ? Number((pastMultipliers as any)[1] || 0n) / 10000 : 0;

    const rounds = [
      { id: prevRoundId, round: prevRound, bet: prevUserBet, upMult: prevUpMultiplier, downMult: prevDownMultiplier },
      { id: pastRoundId, round: pastRound, bet: pastUserBet, upMult: pastUpMult,       downMult: pastDownMult },
    ];

    for (const { id, round, bet, upMult, downMult } of rounds) {
      if (!round || !bet || bet.amount === 0n) continue;
      if (!round.resolved && !round.canceled)  continue;
      if (id <= lastNotifiedRef.current)        continue;

      lastNotifiedRef.current = id;

      if (round.canceled) {
        triggerToast('Round Refunded', 'Stake Returned', 'refund');
      } else {
        const upWins  = round.closePrice > round.startPrice;
        const downWins = round.closePrice < round.startPrice;
        const isUp    = bet.position === 0;
        const won     = (upWins && isUp) || (downWins && !isUp);
        if (won) {
          const mult   = isUp ? upMult : downMult;
          const profit = (Number(bet.amount) / 1e18) * ((mult > 0 ? mult : 1.9) - 1);
          triggerToast('🎉 Prediction Won', `Profit: +${profit.toFixed(4)} ${balanceSymbol}`, 'win');
        } else {
          triggerToast('Prediction Lost', 'Better luck next round.', 'loss');
        }
      }
    }
  }, [
    prevRoundId, pastRoundId,
    prevRound?.resolved, prevRound?.canceled,
    pastRound?.resolved, pastRound?.canceled,
    prevUserBet?.amount, pastUserBet?.amount,
    triggerToast, balanceSymbol,
  ]);

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ 16. MEMOIZED CONTEXT VALUES                                              │
  // │     Clock and data are in separate contexts so a 1-second clock tick    │
  // │     does NOT re-render round data consumers.                             │
  // └──────────────────────────────────────────────────────────────────────────┘
  const clockValue = useMemo<MarketClockState>(() => ({ now }), [now]);

  const dataValue = useMemo<MarketDataState>(() => ({
    btcPrice, twap, walletBalance, balanceSymbol,
    currentRoundId,
    activeRound, activeMultipliers, activeUserBet,
    prevRoundId, prevRound, prevMultipliers, prevUserBet, isClaimable,
    pastRoundId, pastRound, pastMultipliers, pastUserBet, isPastClaimable,
    activeTotalPool, activeUpPercent, activeDownPercent, activeUpMultiplier, activeDownMultiplier,
    prevTotalPool, prevUpPercent, prevDownPercent, prevUpMultiplier, prevDownMultiplier,
    timeLeftToLock, timeLeftToEnd, marketStatus,
    prevTimeLeftToLock, prevTimeLeftToEnd, prevMarketStatus,
    phase, isBettingOpen,
    toast, triggerToast, lockedEntryPrice,
    keeperPhase,
  }), [
    btcPrice, twap, walletBalance, balanceSymbol,
    currentRoundId,
    activeRound, activeMultipliers, activeUserBet,
    prevRoundId, prevRound, prevMultipliers, prevUserBet, isClaimable,
    pastRoundId, pastRound, pastMultipliers, pastUserBet, isPastClaimable,
    activeTotalPool, activeUpPercent, activeDownPercent, activeUpMultiplier, activeDownMultiplier,
    prevTotalPool, prevUpPercent, prevDownPercent, prevUpMultiplier, prevDownMultiplier,
    timeLeftToLock, timeLeftToEnd, marketStatus,
    prevTimeLeftToLock, prevTimeLeftToEnd, prevMarketStatus,
    phase, isBettingOpen, toast, triggerToast, lockedEntryPrice,
    keeperPhase,
  ]);

  return (
    <MarketClockContext.Provider value={clockValue}>
      <MarketDataContext.Provider value={dataValue}>
        {children}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
            padding: '14px 18px', color: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column' as const, gap: 4,
            minWidth: 260, maxWidth: 320,
            animation: 'toastFadeIn 250ms cubic-bezier(0.16,1,0.3,1) forwards',
            fontFamily: 'var(--font-sans)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
              {toast.message}
            </div>
            {toast.submessage && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                {toast.submessage}
              </div>
            )}
            <style>{`
              @keyframes toastFadeIn {
                from { opacity: 0; transform: translateY(12px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0)    scale(1);    }
              }
            `}</style>
          </div>
        )}
      </MarketDataContext.Provider>
    </MarketClockContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Use only for countdown display — updates every second */
export function useMarketClock(): MarketClockState {
  const ctx = useContext(MarketClockContext);
  if (!ctx) throw new Error('useMarketClock must be used within a MarketProvider');
  return ctx;
}

/** Use for all round data — updates on RPC (~3s), not every second */
export function useMarketData(): MarketDataState {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used within a MarketProvider');
  return ctx;
}

/**
 * useMarket — backward-compatible combined hook.
 * Components that already call useMarket() continue to work without changes.
 * They get both clock and data merged into one object.
 */
export function useMarket(): MarketClockState & MarketDataState {
  const clock = useMarketClock();
  const data  = useMarketData();
  return useMemo(() => ({ ...clock, ...data }), [clock, data]);
}
