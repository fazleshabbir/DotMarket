'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useCurrentChain, useContracts, useExplorer } from '../hooks/useNetworkConfig';
import { useEthPrice } from '../hooks/useEthPrice';
import { RoundTimer } from './RoundTimer';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

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

export function BettingPanel({ currentBtcPrice }: BettingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  
  // Custom multi-chain hooks
  const currentChain = useCurrentChain();
  const contracts = useContracts();
  const explorer = useExplorer();
  const ethPriceQuery = useEthPrice();
  
  const MARKET_ADDRESS = contracts.predictionMarket;

  const [inputCurrency, setInputCurrency] = useState<'USDT' | 'NATIVE'>(
    currentChain.bettingToken.isNative ? 'NATIVE' : 'USDT'
  );
  
  // Force reset currency toggle when switching chains
  useEffect(() => {
    setInputCurrency(currentChain.bettingToken.isNative ? 'NATIVE' : 'USDT');
  }, [currentChain.chain.id]);

  const [inputValue, setInputValue] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean, position: number | null }>({ isOpen: false, position: null });

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const hasPlacedActiveBet = activeUserBet && activeUserBet.amount > 0n;

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
  const hasPlacedPrevBet = prevUserBet && prevUserBet.amount > 0n;

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
    if (isPending) setTxStatus('⏳ Waiting for wallet approval...');
    else if (isConfirming) setTxStatus('⛓️ Confirming transaction...');
    else if (isSuccess) {
      setTxStatus('✅ Operation successful!');
      setInputValue('');
      setTimeout(() => setTxStatus(null), 4000);
    }
  }, [isPending, isConfirming, isSuccess]);

  // Handle Conversion
  const parsedInput = parseFloat(inputValue);
  const isValidInput = !isNaN(parsedInput) && parsedInput > 0;
  
  let nativeEthAmountStr = '';
  let usdtDisplayStr = '';
  
  if (currentChain.bettingToken.isNative) {
    // E.g. Arc Testnet where betting token IS the native token (USDC)
    nativeEthAmountStr = isValidInput ? inputValue : '0';
  } else {
    // E.g. Robinhood Testnet where betting token is USDT, but native is ETH
    if (inputCurrency === 'USDT') {
      if (ethPriceQuery.price && isValidInput) {
        nativeEthAmountStr = (parsedInput / ethPriceQuery.price).toFixed(6);
        usdtDisplayStr = inputValue;
      }
    } else {
      if (ethPriceQuery.price && isValidInput) {
        nativeEthAmountStr = inputValue;
        usdtDisplayStr = (parsedInput * ethPriceQuery.price).toFixed(2);
      }
    }
  }

  // Pre-bet validation
  const promptBetConfirmation = (position: number) => {
    if (!isValidInput) return;
    
    // Check if price feed is missing when we need it
    if (!currentChain.bettingToken.isNative && !ethPriceQuery.price) {
      setTxStatus('❌ Unable to retrieve the latest ETH price. Please try again shortly.');
      return;
    }
    
    setConfirmModalState({ isOpen: true, position });
  };

  // Place bet action
  const handlePlaceBet = () => {
    if (confirmModalState.position === null || !nativeEthAmountStr) return;
    setConfirmModalState({ isOpen: false, position: null });
    
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'placeBet',
        args: [activeRoundId, confirmModalState.position],
        value: parseEther(nativeEthAmountStr),
      });
    } catch (err) {
      setTxStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Claim action
  const handleClaim = () => {
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: ROUND_MARKET_ABI,
        functionName: 'claim',
        args: [prevRoundId],
      });
    } catch (err) {
      setTxStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Calculations for Active Round
  const activeNow = Math.floor(Date.now() / 1000);
  const hasValidActiveRound = activeRound && Number(activeRound.lockTimestamp) > 0;
  const isActiveLocked = hasValidActiveRound ? activeNow >= Number(activeRound!.lockTimestamp) : true;
  const isActiveResolved = activeRound?.resolved || activeRound?.canceled || false;
  
  // Disable betting if we don't have price feed on chains that need conversion
  const priceFeedOk = currentChain.bettingToken.isNative || !!ethPriceQuery.price;
  const canBet = isConnected && activeRoundId > 0n && hasValidActiveRound && !isActiveLocked && !isActiveResolved && !hasPlacedActiveBet && !isPending && !isConfirming && priceFeedOk;

  const activeTotalPool = activeRound ? activeRound.totalUpAmount + activeRound.totalDownAmount : 0n;
  const activeUpPercent = activeTotalPool > 0n ? Number((activeRound!.totalUpAmount * 10000n) / activeTotalPool) / 100 : 50;
  const activeDownPercent = activeTotalPool > 0n ? 100 - activeUpPercent : 50;

  const activeUpMultiplier = activeMultipliers ? Number((activeMultipliers as any)[0] || 0n) / 10000 : 0;
  const activeDownMultiplier = activeMultipliers ? Number((activeMultipliers as any)[1] || 0n) / 10000 : 0;

  // Calculations for Previous Round
  const prevTotalPool = prevRound ? prevRound.totalUpAmount + prevRound.totalDownAmount : 0n;
  
  const getPrevOutcome = (): { text: string; color: string; userText?: string; userColor?: string } => {
    if (!prevRound) return { text: '—', color: 'var(--text-muted)' };
    if (!prevRound.resolved && !prevRound.canceled) {
      return { text: 'LIVE MOVEMENT', color: '#ff9800' };
    }
    if (prevRound.canceled) {
      return { text: 'CANCELED', color: 'var(--text-muted)', userText: 'REFUNDED', userColor: '#ffffff' };
    }

    const upWins = prevRound.closePrice > prevRound.startPrice;
    const downWins = prevRound.closePrice < prevRound.startPrice;
    const outcomeText = upWins ? '▲ UP WINS' : downWins ? '▼ DOWN WINS' : 'DRAW';
    const outcomeColor = upWins ? 'var(--up)' : downWins ? 'var(--down)' : 'var(--text-muted)';

    let userText: string | undefined;
    let userColor: string | undefined;

    if (hasPlacedPrevBet && prevUserBet) {
      const userPosition = prevUserBet.position;
      const won = (upWins && userPosition === 0) || (downWins && userPosition === 1);
      const tie = !upWins && !downWins;

      if (tie) {
        userText = 'DRAW';
        userColor = 'var(--text-secondary)';
      } else if (won) {
        userText = 'WINNER';
        userColor = 'var(--up)';
      } else {
        userText = 'LOST';
        userColor = 'var(--down)';
      }
    }

    return { text: outcomeText, color: outcomeColor, userText, userColor };
  };

  const outcome = getPrevOutcome();

  if (!mounted) {
    return (
      <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Panel...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      
      {/* ─── CURRENT BETTING ROUND ────────────────────────────────────────── */}
      <Card hoverEffect={false} style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
            🟢 BTC PAIR
          </div>
          <span
            className="font-mono"
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          >
            Active Round
          </span>
        </div>

        {hasValidActiveRound ? (
          <RoundTimer
            startTimestamp={Number(activeRound!.startTimestamp)}
            endTimestamp={Number(activeRound!.endTimestamp)}
            lockTimestamp={Number(activeRound!.lockTimestamp)}
            resolved={isActiveResolved}
            targetMode="lock"
          />
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '10px 0' }}>
            Awaiting active round creation...
          </div>
        )}

        {/* Pool Visualization */}
        {activeRound && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 600 }}>
                UP {activeUpPercent.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                {activeDownPercent.toFixed(1)}% DOWN
              </span>
            </div>
            <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
              <div className="pool-bar" style={{ width: `${activeUpPercent}%`, background: '#ffffff' }} />
              <div className="pool-bar" style={{ width: `${activeDownPercent}%`, background: '#525252' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {activeTotalPool > 0n ? formatEther(activeRound.totalUpAmount) : '0'} {currentChain.nativeToken.symbol}
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {activeTotalPool > 0n ? formatEther(activeRound.totalDownAmount) : '0'} {currentChain.nativeToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Multipliers */}
        {activeRound && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>UP Payout</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                {activeUpMultiplier > 0 ? `${activeUpMultiplier.toFixed(2)}x` : '—'}
              </div>
            </div>
            <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(82, 82, 82, 0.05)', border: '1px solid rgba(82, 82, 82, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>DOWN Payout</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {activeDownMultiplier > 0 ? `${activeDownMultiplier.toFixed(2)}x` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Live BTC Price */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 16,
            fontSize: 11
          }}
        >
          <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live BTC Price</span>
          <strong className="font-mono" style={{ color: '#ffffff', fontSize: 12 }}>
            ${currentBtcPrice.toFixed(2)}
          </strong>
        </div>

        {/* User's active bet */}
        {hasPlacedActiveBet && activeUserBet && (
          <div className="animate-slide-up" style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: 12, textAlign: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Bet placed: <strong className="font-mono">{formatEther(activeUserBet.amount)} {currentChain.nativeToken.symbol}</strong> on{' '}
              <strong style={{ color: activeUserBet.position === 0 ? '#ffffff' : 'var(--text-secondary)' }}>
                {activeUserBet.position === 0 ? '▲ UP' : '▼ DOWN'}
              </strong>
            </span>
          </div>
        )}

        {/* Bet Input area */}
        {!hasPlacedActiveBet && activeRound && !isActiveLocked && (
          <div style={{ marginBottom: 16 }}>
            
            {/* Live conversion toggles for chains like Robinhood */}
            {!currentChain.bettingToken.isNative && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bet Amount</span>
                
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 2 }}>
                  <button 
                    onClick={() => setInputCurrency('USDT')}
                    style={{
                      padding: '2px 8px',
                      fontSize: 10,
                      borderRadius: 10,
                      fontWeight: 600,
                      color: inputCurrency === 'USDT' ? '#fff' : 'var(--text-secondary)',
                      background: inputCurrency === 'USDT' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {currentChain.bettingToken.symbol}
                  </button>
                  <button 
                    onClick={() => setInputCurrency('NATIVE')}
                    style={{
                      padding: '2px 8px',
                      fontSize: 10,
                      borderRadius: 10,
                      fontWeight: 600,
                      color: inputCurrency === 'NATIVE' ? '#fff' : 'var(--text-secondary)',
                      background: inputCurrency === 'NATIVE' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {currentChain.nativeToken.symbol}
                  </button>
                </div>
              </div>
            )}
            
            <Input
              type="number"
              placeholder="0.0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!canBet}
              min="0.001"
              step="0.001"
              prefixSymbol={inputCurrency === 'USDT' ? currentChain.bettingToken.symbol : currentChain.nativeToken.symbol}
            />
            
            {/* Live Price Conversion Display */}
            {!currentChain.bettingToken.isNative && ethPriceQuery.price && (
              <div className="animate-fade-in" style={{ 
                marginTop: 8, 
                padding: '6px 10px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  ≈ {inputCurrency === 'USDT' ? nativeEthAmountStr || '0.00' : usdtDisplayStr || '0.00'}{' '}
                  {inputCurrency === 'USDT' ? currentChain.nativeToken.symbol : currentChain.bettingToken.symbol}
                </span>
                
                <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                  1 {currentChain.nativeToken.symbol} = {ethPriceQuery.price.toLocaleString()} {currentChain.bettingToken.symbol}
                  <span className="animate-pulse" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#00c805', marginLeft: 6, verticalAlign: 'middle' }} />
                </span>
              </div>
            )}
            
            {!currentChain.bettingToken.isNative && ethPriceQuery.error && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--down)' }}>
                Unable to retrieve the latest {currentChain.nativeToken.symbol} price.
              </div>
            )}
          </div>
        )}

        {/* UP / DOWN Buttons */}
        {!hasPlacedActiveBet && activeRound && !isActiveLocked && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="up"
              style={{ flex: '1 1 0', minWidth: 0, height: 40 }}
              onClick={() => promptBetConfirmation(0)}
              disabled={!canBet || !inputValue}
            >
              ▲ UP
            </Button>
            <Button
              variant="down"
              style={{ flex: '1 1 0', minWidth: 0, height: 40 }}
              onClick={() => promptBetConfirmation(1)}
              disabled={!canBet || !inputValue}
            >
              ▼ DOWN
            </Button>
          </div>
        )}

        {/* Locked notice */}
        {!hasPlacedActiveBet && activeRound && isActiveLocked && (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Next round opens soon
          </div>
        )}

        {!isConnected && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            Connect wallet to bet
          </div>
        )}
      </Card>

      {/* ─── PREVIOUS LOCKED ROUND ────────────────────────────────────────── */}
      {prevRoundId > 0n && prevRound && (
        <Card hoverEffect={false} style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
              🟢 BTC PAIR
            </div>
            <span
              className="font-mono"
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              Last Round
            </span>
          </div>

          <RoundTimer
            startTimestamp={Number(prevRound.startTimestamp)}
            endTimestamp={Number(prevRound.endTimestamp)}
            lockTimestamp={Number(prevRound.lockTimestamp)}
            resolved={prevRound.resolved || prevRound.canceled}
            targetMode="end"
          />

          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.04)', 
              borderRadius: 8, 
              padding: '8px 12px', 
              marginTop: 16,
              marginBottom: 16,
              fontSize: 11
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 9, textTransform: 'uppercase' }}>Locked Price</span>
              <strong className="font-mono" style={{ color: '#ffffff', fontSize: 12 }}>
                ${(Number(prevRound.startPrice) / 1e8).toFixed(2)}
              </strong>
            </div>
            <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 9, textTransform: 'uppercase' }}>
                {prevRound.resolved ? 'Close Price' : 'Live Price'}
              </span>
              <strong className="font-mono" style={{ color: prevRound.resolved ? 'var(--text-secondary)' : '#ffffff', fontSize: 12 }}>
                ${prevRound.resolved 
                  ? (Number(prevRound.closePrice) / 1e8).toFixed(2)
                  : currentBtcPrice.toFixed(2)}
              </strong>
            </div>
          </div>

          {hasPlacedPrevBet && prevUserBet && (
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: 12, textAlign: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                You bet <strong className="font-mono">{formatEther(prevUserBet.amount)} {currentChain.nativeToken.symbol}</strong> on{' '}
                <strong style={{ color: prevUserBet.position === 0 ? '#ffffff' : 'var(--text-secondary)' }}>
                  {prevUserBet.position === 0 ? '▲ UP' : '▼ DOWN'}
                </strong>
              </span>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            {prevRound.resolved || prevRound.canceled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Outcome:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: outcome.color }}>
                    {outcome.text}
                  </span>
                </div>

                {hasPlacedPrevBet && outcome.userText && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Your Position:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: outcome.userColor }}>
                      {outcome.userText}
                    </span>
                  </div>
                )}

                {isClaimable && !prevUserBet?.claimed && (
                  <Button
                    onClick={handleClaim}
                    disabled={isPending || isConfirming}
                    variant="primary"
                    style={{
                      width: '100%',
                      boxShadow: '0 0 12px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    CLAIM REWARDS
                  </Button>
                )}

                {prevUserBet?.claimed && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#ffffff', fontWeight: 600, padding: '4px 0' }}>
                    ✓ REWARDS CLAIMED SUCCESSFULLY
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', border: '1px dashed rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: 6 }}>
                🕒 Waiting for close price...
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal 
        isOpen={confirmModalState.isOpen} 
        onClose={() => setConfirmModalState({ isOpen: false, position: null })} 
        title="Confirm Prediction"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>You are about to place:</div>
            
            {!currentChain.bettingToken.isNative && inputCurrency === 'USDT' ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {inputValue} {currentChain.bettingToken.symbol}
                </div>
                <div style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  ≈ {nativeEthAmountStr} {currentChain.nativeToken.symbol}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {nativeEthAmountStr} {currentChain.nativeToken.symbol}
                </div>
                {!currentChain.bettingToken.isNative && (
                  <div style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    ≈ {usdtDisplayStr} {currentChain.bettingToken.symbol}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Direction</span>
              <strong style={{ color: confirmModalState.position === 0 ? 'var(--up)' : 'var(--down)' }}>
                {confirmModalState.position === 0 ? '▲ UP' : '▼ DOWN'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Network</span>
              <strong style={{ color: '#ffffff' }}>{currentChain.chain.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Settlement Currency</span>
              <strong style={{ color: '#ffffff' }}>{currentChain.nativeToken.symbol}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gas Token</span>
              <strong style={{ color: '#ffffff' }}>{currentChain.nativeToken.symbol}</strong>
            </div>
          </div>

          {!currentChain.bettingToken.isNative && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              ≈ Estimated using the live {currentChain.nativeToken.symbol}/{currentChain.bettingToken.symbol} market price.<br/>
              The actual blockchain transaction and settlement occur entirely in native {currentChain.nativeToken.symbol}.
            </div>
          )}

          <Button 
            variant={confirmModalState.position === 0 ? 'up' : 'down'}
            size="lg" 
            onClick={handlePlaceBet}
            style={{ width: '100%', marginTop: 8 }}
          >
            Confirm & Place Bet
          </Button>
        </div>
      </Modal>

      {/* Operation Status Messages */}
      {txStatus && (
        <Card hoverEffect={false} style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          {txStatus.includes('http') ? (
             <a href={txStatus} target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>View Transaction</a>
          ) : (
            txStatus
          )}
        </Card>
      )}
    </div>
  );
}
