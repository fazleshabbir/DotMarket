export const ROUND_MARKET_ABI = [
  { type: 'function', name: 'currentRoundId', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'roundDuration', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'lockBuffer', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'minBetAmount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'protocolFeeBps', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'paused', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  {
    type: 'function', name: 'getRound',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [{
      type: 'tuple', name: '', components: [
        { name: 'roundId', type: 'uint256' },
        { name: 'startPrice', type: 'int256' },
        { name: 'closePrice', type: 'int256' },
        { name: 'totalUpAmount', type: 'uint256' },
        { name: 'totalDownAmount', type: 'uint256' },
        { name: 'startTimestamp', type: 'uint256' },
        { name: 'lockTimestamp', type: 'uint256' },
        { name: 'endTimestamp', type: 'uint256' },
        { name: 'rewardBaseCalAmount', type: 'uint256' },
        { name: 'rewardAmount', type: 'uint256' },
        { name: 'resolved', type: 'bool' },
        { name: 'canceled', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getUserBet',
    inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'user', type: 'address' }],
    outputs: [{
      type: 'tuple', name: '', components: [
        { name: 'position', type: 'uint8' },
        { name: 'amount', type: 'uint256' },
        { name: 'claimed', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
  { type: 'function', name: 'getUserRounds', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256[]' }], stateMutability: 'view' },
  { type: 'function', name: 'claimable', inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'user', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  {
    type: 'function', name: 'getMultipliers',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [{ name: 'upMultiplier', type: 'uint256' }, { name: 'downMultiplier', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'function', name: 'placeBet', inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'position', type: 'uint8' }], outputs: [], stateMutability: 'payable' },
  { type: 'function', name: 'claim', inputs: [{ name: 'roundId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  // Events
  { type: 'event', name: 'RoundOpened', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'startTimestamp', type: 'uint256', indexed: false }, { name: 'lockTimestamp', type: 'uint256', indexed: false }, { name: 'endTimestamp', type: 'uint256', indexed: false }, { name: 'startPrice', type: 'int256', indexed: false }] },
  { type: 'event', name: 'BetPlaced', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'user', type: 'address', indexed: true }, { name: 'position', type: 'uint8', indexed: false }, { name: 'amount', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'RoundResolved', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'closePrice', type: 'int256', indexed: false }, { name: 'upWins', type: 'bool', indexed: false }] },
  { type: 'event', name: 'Claimed', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'user', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] },
] as const;

// ⚠️  Replace with your deployed contract address after running `npm run deploy:arc-testnet`
export const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
