// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoundMarket
 * @author dotMarket
 * @notice A decentralized, high-frequency pari-mutuel prediction market.
 *         Users bet UP or DOWN on a crypto pair's price movement within
 *         fixed-duration rounds. The winning side splits the total pool
 *         minus a configurable protocol fee.
 * @dev    The keeper bot fetches prices from CoinGecko/Binance and pushes
 *         them on-chain directly. No external oracle dependency required.
 */
contract RoundMarket is ReentrancyGuard, Ownable {

    // ─── Enums ────────────────────────────────────────────────────────
    enum Position { Up, Down }

    // ─── Structs ──────────────────────────────────────────────────────
    struct Round {
        uint256 roundId;
        int256  startPrice;           // Price at round open (8 decimals, e.g. 6500000000000 = $65000)
        int256  closePrice;           // Price at round resolve
        uint256 totalUpAmount;        // Total native value bet on UP
        uint256 totalDownAmount;      // Total native value bet on DOWN
        uint256 startTimestamp;       // Block timestamp when opened
        uint256 lockTimestamp;        // Bets rejected after this
        uint256 endTimestamp;         // Round eligible for resolution
        uint256 rewardBaseCalAmount;  // Winning-side total (denominator)
        uint256 rewardAmount;         // Pool minus protocol fee
        bool    resolved;
        bool    canceled;             // Refund mode (tie / one-sided / emergency)
    }

    struct Bet {
        Position position;
        uint256  amount;
        bool     claimed;
    }

    // ─── State ────────────────────────────────────────────────────────
    string  public pair;              // e.g. "BTC/USD"
    uint256 public currentRoundId;
    uint256 public roundDuration;     // seconds (120, 180, 300, 600)
    uint256 public lockBuffer;        // seconds before end to stop bets (10)
    uint256 public minBetAmount;      // minimum bet in native wei
    uint256 public protocolFeeBps;    // 300 = 3%
    uint256 public treasuryAmount;    // Accumulated fees claimable by owner
    address public keeperAddress;     // Authorized round operator
    bool    public paused;            // Emergency pause

    mapping(uint256 => Round)                      public rounds;
    mapping(uint256 => mapping(address => Bet))    public bets;
    mapping(address => uint256[])                  public userRounds;

    // ─── Events ───────────────────────────────────────────────────────
    event RoundOpened(
        uint256 indexed roundId,
        uint256 startTimestamp,
        uint256 lockTimestamp,
        uint256 endTimestamp,
        int256  startPrice
    );
    event BetPlaced(
        uint256 indexed roundId,
        address indexed user,
        Position position,
        uint256 amount
    );
    event RoundResolved(
        uint256 indexed roundId,
        int256  closePrice,
        bool    upWins
    );
    event Claimed(
        uint256 indexed roundId,
        address indexed user,
        uint256 amount
    );
    event RoundCanceled(uint256 indexed roundId);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event Paused(bool isPaused);
    event RoundLocked(uint256 indexed roundId, int256 lockPrice);

    // ─── Modifiers ────────────────────────────────────────────────────
    modifier onlyKeeper() {
        require(msg.sender == keeperAddress, "RM: caller is not the keeper");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "RM: contract is paused");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────
    /**
     * @param _pair           Price pair string, e.g. "BTC/USD"
     * @param _roundDuration  Round length in seconds
     * @param _lockBuffer     Seconds before end when bets lock
     * @param _minBetAmount   Minimum bet in native wei
     * @param _protocolFeeBps Fee in basis points (300 = 3%)
     * @param _keeper         Initial keeper bot address
     */
    constructor(
        string  memory _pair,
        uint256 _roundDuration,
        uint256 _lockBuffer,
        uint256 _minBetAmount,
        uint256 _protocolFeeBps,
        address _keeper
    ) Ownable(msg.sender) {
        require(_keeper != address(0), "RM: zero keeper address");
        require(_roundDuration > _lockBuffer, "RM: duration <= buffer");
        require(_protocolFeeBps <= 1000, "RM: fee exceeds 10%");

        pair            = _pair;
        roundDuration   = _roundDuration;
        lockBuffer      = _lockBuffer;
        minBetAmount    = _minBetAmount;
        protocolFeeBps  = _protocolFeeBps;
        keeperAddress   = _keeper;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        KEEPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Opens a new round (without setting start price immediately).
     */
    function openRound() public onlyKeeper whenNotPaused {
        // Ensure the previous round is resolved or canceled before starting a new one
        if (currentRoundId > 0) {
            Round storage prev = rounds[currentRoundId];
            require(
                prev.resolved || prev.canceled,
                "RM: previous round not resolved"
            );
        }

        currentRoundId++;
        uint256 startTs = block.timestamp;
        uint256 lockTs  = startTs + roundDuration - lockBuffer;
        uint256 endTs   = startTs + roundDuration;

        rounds[currentRoundId] = Round({
            roundId:             currentRoundId,
            startPrice:          0,
            closePrice:          0,
            totalUpAmount:       0,
            totalDownAmount:     0,
            startTimestamp:      startTs,
            lockTimestamp:       lockTs,
            endTimestamp:        endTs,
            rewardBaseCalAmount: 0,
            rewardAmount:        0,
            resolved:            false,
            canceled:            false
        });

        emit RoundOpened(currentRoundId, startTs, lockTs, endTs, 0);
    }

    /**
     * @notice Record the official lock price for a round at its lock time.
     * @param  roundId    The round to lock
     * @param  lockPrice  The price of the asset at lock time
     */
    function lockRound(uint256 roundId, int256 lockPrice) public onlyKeeper {
        Round storage round = rounds[roundId];

        require(round.startTimestamp != 0, "RM: round does not exist");
        require(block.timestamp >= round.lockTimestamp, "RM: not lockable yet");
        require(round.startPrice == 0, "RM: already locked");
        require(lockPrice > 0, "RM: invalid lock price");

        round.startPrice = lockPrice;
        emit RoundLocked(roundId, lockPrice);
    }

    /**
     * @notice Resolves a round using the keeper-provided close price.
     * @param  roundId     The round to resolve
     * @param  closePrice  Current price from CoinGecko/Binance (8 decimals)
     */
    function resolveRound(
        uint256 roundId,
        int256  closePrice
    ) external onlyKeeper nonReentrant {
        Round storage round = rounds[roundId];

        require(round.startTimestamp != 0, "RM: round does not exist");
        require(block.timestamp >= round.endTimestamp, "RM: round not ended");
        require(!round.resolved && !round.canceled, "RM: already settled");
        require(round.startPrice > 0, "RM: round not locked");
        require(closePrice > 0, "RM: invalid close price");

        round.closePrice = closePrice;
        round.resolved   = true;

        uint256 totalPool = round.totalUpAmount + round.totalDownAmount;

        // ── No bets at all → just resolve with no payouts ──
        if (totalPool == 0) {
            emit RoundResolved(roundId, closePrice, false);
            return;
        }

        // ── Determine outcome ──
        if (closePrice > round.startPrice) {
            // UP wins
            _settleRound(round, round.totalUpAmount, totalPool);
        } else if (closePrice < round.startPrice) {
            // DOWN wins
            _settleRound(round, round.totalDownAmount, totalPool);
        } else {
            // TIE — cancel & refund all bettors
            round.canceled     = true;
            round.rewardAmount = totalPool;
        }

        emit RoundResolved(
            roundId,
            closePrice,
            closePrice > round.startPrice
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //                          USER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Place a bet on the current round.
     * @param roundId  The round to bet on (must be open & unlocked)
     * @param position 0 = Up, 1 = Down
     */
    function placeBet(
        uint256 roundId,
        Position position
    ) external payable nonReentrant whenNotPaused {
        Round storage round = rounds[roundId];

        require(round.startTimestamp != 0, "RM: round does not exist");
        require(block.timestamp >= round.startTimestamp, "RM: not started");
        require(block.timestamp < round.lockTimestamp, "RM: round is locked");
        require(!round.resolved && !round.canceled, "RM: round settled");
        require(msg.value >= minBetAmount, "RM: bet below minimum");

        Bet storage bet = bets[roundId][msg.sender];
        if (bet.amount > 0) {
            require(bet.position == position, "RM: cannot bet both sides");
        } else {
            userRounds[msg.sender].push(roundId);
        }

        bet.position = position;
        bet.amount += msg.value;
        bet.claimed = false;

        if (position == Position.Up) {
            round.totalUpAmount += msg.value;
        } else {
            round.totalDownAmount += msg.value;
        }

        emit BetPlaced(roundId, msg.sender, position, msg.value);
    }

    /**
     * @notice Claim winnings (or refund if canceled) for a resolved round.
     */
    function claim(uint256 roundId) external nonReentrant {
        Round storage round = rounds[roundId];
        require(round.resolved || round.canceled, "RM: not settled");

        Bet storage bet = bets[roundId][msg.sender];
        require(bet.amount > 0, "RM: no bet found");
        require(!bet.claimed, "RM: already claimed");

        bet.claimed = true;

        uint256 payout = _calculatePayout(round, bet);
        require(payout > 0, "RM: not eligible for payout");

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "RM: transfer failed");

        emit Claimed(roundId, msg.sender, payout);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    function getUserBet(
        uint256 roundId,
        address user
    ) external view returns (Bet memory) {
        return bets[roundId][user];
    }

    function getUserRounds(
        address user
    ) external view returns (uint256[] memory) {
        return userRounds[user];
    }

    function claimable(
        uint256 roundId,
        address user
    ) external view returns (bool) {
        Round memory round = rounds[roundId];
        Bet memory bet = bets[roundId][user];

        if (bet.amount == 0 || bet.claimed) return false;
        if (!round.resolved && !round.canceled) return false;

        return _calculatePayout(round, bet) > 0;
    }

    function getMultipliers(
        uint256 roundId
    ) external view returns (uint256 upMultiplier, uint256 downMultiplier) {
        Round memory round = rounds[roundId];
        uint256 totalPool = round.totalUpAmount + round.totalDownAmount;

        if (totalPool == 0) return (0, 0);

        uint256 rewardPool = totalPool - (totalPool * protocolFeeBps) / 10000;

        if (round.totalUpAmount > 0) {
            upMultiplier = (rewardPool * 10000) / round.totalUpAmount;
        }
        if (round.totalDownAmount > 0) {
            downMultiplier = (rewardPool * 10000) / round.totalDownAmount;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "RM: zero address");
        emit KeeperUpdated(keeperAddress, _keeper);
        keeperAddress = _keeper;
    }

    function setProtocolFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "RM: fee exceeds 10%");
        protocolFeeBps = _feeBps;
    }

    function setMinBetAmount(uint256 _minBet) external onlyOwner {
        minBetAmount = _minBet;
    }

    function setRoundDuration(uint256 _duration) external onlyOwner {
        require(_duration > lockBuffer, "RM: duration <= buffer");
        roundDuration = _duration;
    }

    function setLockBuffer(uint256 _buffer) external onlyOwner {
        require(roundDuration > _buffer, "RM: buffer >= duration");
        lockBuffer = _buffer;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function withdrawTreasury() external onlyOwner {
        uint256 amount = treasuryAmount;
        require(amount > 0, "RM: nothing to withdraw");
        treasuryAmount = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "RM: transfer failed");
    }

    function cancelRound(uint256 roundId) external onlyOwner {
        Round storage round = rounds[roundId];
        require(!round.resolved, "RM: already resolved");
        require(!round.canceled, "RM: already canceled");

        round.canceled     = true;
        round.rewardAmount = round.totalUpAmount + round.totalDownAmount;

        emit RoundCanceled(roundId);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                       INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════════

    function _settleRound(
        Round storage round,
        uint256 winnerSideAmount,
        uint256 totalPool
    ) internal {
        if (winnerSideAmount == 0) {
            round.canceled     = true;
            round.rewardAmount = totalPool;
            return;
        }

        uint256 fee = (totalPool * protocolFeeBps) / 10000;
        treasuryAmount += fee;

        round.rewardBaseCalAmount = winnerSideAmount;
        round.rewardAmount        = totalPool - fee;
    }

    function _calculatePayout(
        Round memory round,
        Bet memory bet
    ) internal pure returns (uint256) {
        if (round.canceled) {
            return bet.amount;
        }

        if (round.rewardBaseCalAmount == 0) {
            return 0;
        }

        bool upWins   = round.closePrice > round.startPrice;
        bool downWins = round.closePrice < round.startPrice;

        bool isWinner = (upWins   && bet.position == Position.Up)
                     || (downWins && bet.position == Position.Down);

        if (!isWinner) return 0;

        return (bet.amount * round.rewardAmount) / round.rewardBaseCalAmount;
    }

    receive() external payable {}
}
