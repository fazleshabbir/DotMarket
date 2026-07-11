'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from './ConnectButton';
import { ActiveRoundCard } from './trade/ActiveRoundCard';
import { LastRoundCard } from './trade/LastRoundCard';
import { LoadingSkeleton } from './trade/LoadingSkeleton';
import { PlaceBetCard } from './trade/PlaceBetCard';

interface Bet {
  betId: bigint;
  user: string;
  position: number; // 0 = UP, 1 = DOWN
  stake: bigint;
  entryTime: bigint;
  expiryTime: bigint;
  entryPrice: bigint;
  settlementPrice: bigint;
  lockedMultiplier: bigint;
  status: number; // 0 = Running, 1 = Won, 2 = Lost, 3 = Push
  payout: bigint;
  claimed: boolean;
}

interface BettingPanelProps {
  currentBtcPrice: number;
}

export function BettingPanel({ currentBtcPrice }: BettingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // States read from contract
  const [activeUpPool, setActiveUpPool] = useState<bigint>(0n);
  const [activeDownPool, setActiveDownPool] = useState<bigint>(0n);
  const [virtualUp, setVirtualUp] = useState<bigint>(1000n * 10n**18n); // Default 1000 USDC
  const [virtualDown, setVirtualDown] = useState<bigint>(1000n * 10n**18n);
  const [protocolFeeBps, setProtocolFeeBps] = useState<bigint>(300n); // 3%
  const [latestPriceTimestamp, setLatestPriceTimestamp] = useState<bigint>(0n);

  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [historyBets, setHistoryBets] = useState<Bet[]>([]);

  const contracts = useContracts();
  const MARKET_ADDRESS = contracts.predictionMarket;
  const publicClient = usePublicClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Polling data loop
  useEffect(() => {
    if (!publicClient || !MARKET_ADDRESS) return;

    let isSubscribed = true;

    const fetchData = async () => {
      try {
        // Read global stats
        const [upPool, downPool, vUp, vDown, fee, lastTs] = await Promise.all([
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'activeUpPool' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'activeDownPool' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'virtualUp' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'virtualDown' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'protocolFeeBps' }),
          publicClient.readContract({ address: MARKET_ADDRESS, abi: ROUND_MARKET_ABI, functionName: 'latestPriceTimestamp' }),
        ]) as [bigint, bigint, bigint, bigint, bigint, bigint];

        if (!isSubscribed) return;

        setActiveUpPool(upPool);
        setActiveDownPool(downPool);
        setVirtualUp(vUp);
        setVirtualDown(vDown);
        setProtocolFeeBps(fee);
        setLatestPriceTimestamp(lastTs);

        // Read user's active & history bets
        if (address) {
          const betIds = await publicClient.readContract({
            address: MARKET_ADDRESS,
            abi: ROUND_MARKET_ABI,
            // @ts-ignore
            functionName: 'getUserBets',
            args: [address],
          }) as bigint[];

          if (!isSubscribed) return;

          const recentIds = betIds.slice(-20).reverse();

          const betsList = await Promise.all(
            recentIds.map(async (id) => {
              const data = await publicClient.readContract({
                address: MARKET_ADDRESS,
                abi: ROUND_MARKET_ABI,
                functionName: 'getBet',
                args: [id],
              }) as any;
              return {
                betId: data.betId,
                user: data.user,
                position: data.position,
                stake: data.stake,
                entryTime: data.entryTime,
                expiryTime: data.expiryTime,
                entryPrice: data.entryPrice,
                settlementPrice: data.settlementPrice,
                lockedMultiplier: data.lockedMultiplier,
                status: data.status,
                payout: data.payout,
                claimed: data.claimed,
              } as Bet;
            })
          );

          if (!isSubscribed) return;

          const active = betsList.filter((b) => b.status === 0);
          const history = betsList.filter((b) => b.status !== 0);

          setActiveBets(active);
          setHistoryBets(history);
        }
      } catch (err) {
        console.error('Error fetching continuous market data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [publicClient, MARKET_ADDRESS, address]);

  // Write contract actions
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isPending) setTxStatus('Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('Bet placed successfully!');
      setBetAmount('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  // Place bet action
  const handlePlaceBet = (position: number) => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [position],
        value: parseEther(betAmount),
      });
    } catch (err) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Live Multiplier calculation matching ContinuousMarket.sol
  const getLiveMultipliers = () => {
    const currentUpTotal = activeUpPool + virtualUp;
    const currentDownTotal = activeDownPool + virtualDown;
    const currentTotal = currentUpTotal + currentDownTotal;

    if (currentTotal === 0n) return { up: 2.0, down: 2.0 };

    let rawUp = (currentTotal * 10000n) / currentUpTotal;
    let rawDown = (currentTotal * 10000n) / currentDownTotal;

    if (rawUp < 11000n) rawUp = 11000n;
    if (rawUp > 100000n) rawUp = 100000n;
    if (rawDown < 11000n) rawDown = 11000n;
    if (rawDown > 100000n) rawDown = 100000n;

    const feeMultiplierUp = rawUp - (rawUp * protocolFeeBps) / 10000n;
    const feeMultiplierDown = rawDown - (rawDown * protocolFeeBps) / 10000n;

    return {
      up: Number(feeMultiplierUp) / 10000,
      down: Number(feeMultiplierDown) / 10000,
    };
  };

  const multipliers = getLiveMultipliers();

  // Reference price stale checks (must be within 30 seconds of latest block timestamp)
  const now = Math.floor(Date.now() / 1000);
  const isReferencePriceFresh = now - Number(latestPriceTimestamp) <= 30;

  const canBet =
    isConnected &&
    isReferencePriceFresh &&
    !isPending &&
    !isConfirming;

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>
      {/* 1. Action Panel: Place Bet Card */}
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
        upMultiplier={multipliers.up}
        downMultiplier={multipliers.down}
      />

      {/* 2. Prominent Visual Panel: Live Market Card & Active Bets */}
      <ActiveRoundCard
        currentBtcPrice={currentBtcPrice}
        totalUpPool={activeUpPool}
        totalDownPool={activeDownPool}
        virtualUp={virtualUp}
        virtualDown={virtualDown}
        upMultiplier={multipliers.up}
        downMultiplier={multipliers.down}
        activeBets={activeBets}
      />

      {/* 3. Secondary Info Panel: Bet History Card */}
      <LastRoundCard historyBets={historyBets} />
    </div>
  );
}
