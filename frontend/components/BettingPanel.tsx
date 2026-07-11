'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from './ConnectButton';
import { ActiveRoundCard } from './trade/ActiveRoundCard';
import { LastRoundCard } from './trade/LastRoundCard';
import { LoadingSkeleton } from './trade/LoadingSkeleton';
import { PlaceBetCard } from './trade/PlaceBetCard';

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

interface BettingPanelProps {
  currentBtcPrice: number;
}

type TabId = 'live' | 'bet' | 'previous';

const TABS: { id: TabId; label: string }[] = [
  { id: 'live',     label: 'LIVE MARKET' },
  { id: 'bet',      label: 'PLACE BET'   },
  { id: 'previous', label: 'PREVIOUS'    },
];

export function BettingPanel({ currentBtcPrice }: BettingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;

  useEffect(() => { setMounted(true); }, []);

  // 1. Read current round ID
  const { data: currentRoundId } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 2000 },
  });

  const activeRoundId = currentRoundId ? BigInt(currentRoundId.toString()) : 0n;
  const prevRoundId = activeRoundId > 1n ? activeRoundId - 1n : 0n;

  // 2. Active Round Data
  const { data: activeRoundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });
  const activeRound = activeRoundData as unknown as RoundData | undefined;

  const { data: activeMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [activeRoundId],
    query: { enabled: activeRoundId > 0n, refetchInterval: 2000 },
  });

  const { data: activeUserBetData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [activeRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: activeRoundId > 0n && !!address, refetchInterval: 2000 },
  });
  const activeUserBet = activeUserBetData as unknown as { position: number; amount: bigint; claimed: boolean } | undefined;
  const hasPlacedActiveBet = !!(activeUserBet && activeUserBet.amount > 0n);

  // 3. Previous Round Data
  const { data: prevRoundData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getRound',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2000 },
  });
  const prevRound = prevRoundData as unknown as RoundData | undefined;

  const { data: prevMultipliers } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getMultipliers',
    args: [prevRoundId],
    query: { enabled: prevRoundId > 0n, refetchInterval: 2000 },
  });

  const { data: prevUserBetData } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'getUserBet',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2000 },
  });
  const prevUserBet = prevUserBetData as unknown as { position: number; amount: bigint; claimed: boolean } | undefined;
  const hasPlacedPrevBet = !!(prevUserBet && prevUserBet.amount > 0n);

  const { data: isClaimable } = useReadContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: 'claimable',
    args: [prevRoundId, address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: prevRoundId > 0n && !!address, refetchInterval: 2000 },
  });

  // Write contract actions
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setTxStatus('Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('Operation successful!');
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  const handlePlaceBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [activeRoundId, position],
        value: parseEther(betAmount),
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClaim = () => {
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'claim',
        args: [prevRoundId],
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Calculations for Active Round
  const activeNow = Math.floor(Date.now() / 1000);
  const hasValidActiveRound = !!(activeRound && Number(activeRound.lockTimestamp) > 0);
  const isActiveLocked = hasValidActiveRound ? activeNow >= Number(activeRound!.lockTimestamp) : true;
  const isActiveResolved = activeRound?.resolved || activeRound?.canceled || false;
  const canBet = isConnected && activeRoundId > 0n && hasValidActiveRound && !isActiveLocked && !isActiveResolved && !hasPlacedActiveBet && !isPending && !isConfirming;

  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeRound!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  const getPrevOutcome = (): { text: string; color: string; userText?: string; userColor?: string } => {
    if (!prevRound) return { text: '—', color: 'var(--text-muted)' };
    if (!prevRound.resolved && !prevRound.canceled) return { text: 'LIVE MOVEMENT', color: '#ffffff' };
    if (prevRound.canceled) return { text: 'CANCELED', color: 'var(--text-muted)', userText: 'REFUNDED', userColor: '#ffffff' };

    const upWins = prevRound.closePrice > prevRound.startPrice;
    const downWins = prevRound.closePrice < prevRound.startPrice;
    const outcomeText = upWins ? '▲ UP WINS' : downWins ? '▼ DOWN WINS' : 'DRAW';
    const outcomeColor = '#ffffff';

    let userText: string | undefined;
    let userColor: string | undefined;
    if (hasPlacedPrevBet && prevUserBet) {
      const won = (upWins && prevUserBet.position === 0) || (downWins && prevUserBet.position === 1);
      const tie = !upWins && !downWins;
      userText = tie ? 'DRAW' : won ? 'WINNER' : 'LOST';
      userColor = tie ? 'var(--text-secondary)' : won ? '#ffffff' : 'rgba(255,255,255,0.4)';
    }

    return { text: outcomeText, color: outcomeColor, userText, userColor };
  };

  const outcome = getPrevOutcome();

  if (!mounted) return <LoadingSkeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '4px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#000000' : 'rgba(255,255,255,0.35)',
                transition: 'all 200ms ease',
                outline: 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab panel (fills remaining height) ─────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {activeTab === 'live' && (
          <ActiveRoundCard
            hasValidActiveRound={hasValidActiveRound}
            activeRoundId={activeRoundId}
            activeRound={activeRound}
            isActiveLocked={isActiveLocked}
            isActiveResolved={isActiveResolved}
            activeUpPercent={activeUpPercent}
            activeDownPercent={activeDownPercent}
            activeTotalPool={activeTotalPool}
            activeUpMultiplier={activeUpMultiplier}
            activeDownMultiplier={activeDownMultiplier}
            currentBtcPrice={currentBtcPrice}
          />
        )}

        {activeTab === 'bet' && (
          <PlaceBetCard
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            onPlaceBet={handlePlaceBet}
            canBet={canBet}
            isPending={isPending}
            isConfirming={isConfirming}
            txStatus={txStatus}
            isConnected={isConnected}
            connectWalletCTA={<ConnectButton />}
          />
        )}

        {activeTab === 'previous' && (
          <LastRoundCard
            prevRoundId={prevRoundId}
            prevRound={prevRound}
            outcome={outcome}
            hasPlacedPrevBet={hasPlacedPrevBet}
            prevUserBet={prevUserBet}
            isClaimable={isClaimable as boolean}
            onClaim={handleClaim}
            isClaimingPending={isPending}
            isClaimingConfirming={isConfirming}
            claimStatus={null}
          />
        )}
      </div>
    </div>
  );
}
