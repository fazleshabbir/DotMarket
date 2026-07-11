// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContinuousMarket
 * @author dotMarket
 * @notice A continuous, roundless prediction market system.
 *         Every bet is an independent 60-second contract using USDC (native)
 *         for trading and settlement. Multipliers are locked at entry.
 */
contract ContinuousMarket is ReentrancyGuard, Ownable {

    // ─── Enums ────────────────────────────────────────────────────────
    enum Position { Up, Down }
    enum Status { Running, Won, Lost, Push }

    // ─── Structs ──────────────────────────────────────────────────────
    struct Bet {
        uint256  betId;
        address  user;
        Position position;
        uint256  stake;             // Staked USDC amount
        uint256  entryTime;         // Block timestamp at placement
        uint256  expiryTime;        // Expiry timestamp (entryTime + 60s)
        int256   entryPrice;        // BTC/USD price at entry
        int256   settlementPrice;   // BTC/USD price at expiry
        uint256  lockedMultiplier;  // Multiplier locked at entry (4 decimals, e.g. 17500 = 1.75x)
        Status   status;
        uint256  payout;
        bool     claimed;
    }

    // ─── State ────────────────────────────────────────────────────────
    string  public pair;              // e.g. "BTC/USD"
    uint256 public totalBetsCount;
    uint256 public minBetAmount;      // minimum bet in USDC wei
    uint256 public protocolFeeBps;    // 300 = 3%
    uint256 public treasuryAmount;    // Accumulated fees
    address public keeperAddress;     // Authorized pricing operator
    bool    public paused;

    // AMM / Pari-mutuel Pool Values
    uint256 public activeUpPool;
    uint256 public activeDownPool;
    uint256 public virtualUp;         // virtual seed to prevent division by zero or extreme ratios
    uint256 public virtualDown;       // virtual seed to prevent division by zero or extreme ratios

    // Price Oracle States
    int256  public latestPrice;
    uint256 public latestPriceTimestamp;

    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;

    // ─── Events ───────────────────────────────────────────────────────
    event BetPlaced(
        uint256 indexed betId,
        address indexed user,
        Position position,
        uint256 stake,
        int256 entryPrice,
        uint256 lockedMultiplier,
        uint256 entryTime,
        uint256 expiryTime
    );

    event BetResolved(
        uint256 indexed betId,
        address indexed user,
        int256 settlementPrice,
        Status status,
        uint256 payout
    );

    event PricePushed(int256 price, uint256 timestamp);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event Paused(bool isPaused);

    // ─── Modifiers ────────────────────────────────────────────────────
    modifier onlyKeeper() {
        require(msg.sender == keeperAddress, "CM: caller is not the keeper");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "CM: contract is paused");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────
    constructor(
        string memory _pair,
        uint256 _minBetAmount,
        uint256 _protocolFeeBps,
        uint256 _virtualUp,
        uint256 _virtualDown,
        address _keeper
    ) Ownable(msg.sender) {
        require(_keeper != address(0), "CM: zero keeper address");
        require(_protocolFeeBps <= 1000, "CM: fee exceeds 10%");

        pair = _pair;
        minBetAmount = _minBetAmount;
        protocolFeeBps = _protocolFeeBps;
        virtualUp = _virtualUp;
        virtualDown = _virtualDown;
        keeperAddress = _keeper;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        KEEPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Pushes the latest reference asset price on-chain.
     */
    function pushPrice(int256 price) external onlyKeeper {
        require(price > 0, "CM: invalid price");
        latestPrice = price;
        latestPriceTimestamp = block.timestamp;
        emit PricePushed(price, block.timestamp);
    }

    /**
     * @notice Resolves a specific expired bet contract.
     *         Calculates winner logic, handles payouts, and adjusts active pool values.
     */
    function resolveBet(uint256 betId, int256 settlementPrice) external onlyKeeper nonReentrant {
        Bet storage bet = bets[betId];
        require(bet.stake > 0, "CM: bet does not exist");
        require(bet.status == Status.Running, "CM: bet already settled");
        require(block.timestamp >= bet.expiryTime, "CM: contract not expired yet");
        require(settlementPrice > 0, "CM: invalid settlement price");

        bet.settlementPrice = settlementPrice;

        // 1. Determine Position Results
        Status resultStatus;
        uint256 payoutAmount = 0;

        if (settlementPrice > bet.entryPrice) {
            // UP wins
            if (bet.position == Position.Up) {
                resultStatus = Status.Won;
                payoutAmount = (bet.stake * bet.lockedMultiplier) / 10000;
            } else {
                resultStatus = Status.Lost;
            }
        } else if (settlementPrice < bet.entryPrice) {
            // DOWN wins
            if (bet.position == Position.Down) {
                resultStatus = Status.Won;
                payoutAmount = (bet.stake * bet.lockedMultiplier) / 10000;
            } else {
                resultStatus = Status.Lost;
            }
        } else {
            // PUSH - tie, refund original stake
            resultStatus = Status.Push;
            payoutAmount = bet.stake;
        }

        bet.status = resultStatus;
        bet.payout = payoutAmount;
        bet.claimed = true;

        // 2. Remove stake from active pool sums
        if (bet.position == Position.Up) {
            activeUpPool = activeUpPool >= bet.stake ? activeUpPool - bet.stake : 0;
        } else {
            activeDownPool = activeDownPool >= bet.stake ? activeDownPool - bet.stake : 0;
        }

        // 3. Issue payout if greater than 0
        if (payoutAmount > 0) {
            // Ensure contract balance is sufficient (or default fallback refund)
            uint256 balance = address(this).balance;
            if (payoutAmount > balance) {
                payoutAmount = balance;
            }
            (bool success, ) = payable(bet.user).call{value: payoutAmount}("");
            require(success, "CM: settlement transfer failed");
        }

        emit BetResolved(betId, bet.user, settlementPrice, resultStatus, payoutAmount);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        USER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Places an independent 60-second prediction contract.
     *         Locks the live dynamic multiplier and entry price.
     */
    function placeBet(Position position) external payable nonReentrant whenNotPaused {
        require(msg.value >= minBetAmount, "CM: bet stake below minimum");
        // Prevent placing bets if the reference price is stale (e.g. older than 30s)
        require(block.timestamp - latestPriceTimestamp <= 30, "CM: stale reference price");

        uint256 currentUpTotal = activeUpPool + virtualUp;
        uint256 currentDownTotal = activeDownPool + virtualDown;
        uint256 currentTotal = currentUpTotal + currentDownTotal;

        // 1. Calculate dynamic multiplier based on liquidity pools *before* adding this bet
        uint256 multiplier;
        if (position == Position.Up) {
            multiplier = (currentTotal * 10000) / currentUpTotal;
        } else {
            multiplier = (currentTotal * 10000) / currentDownTotal;
        }

        // Apply sensible limits to dynamic multipliers (1.10x to 10.00x)
        if (multiplier < 11000) multiplier = 11000;
        if (multiplier > 100000) multiplier = 100000;

        // Apply protocol fee to the dynamic multiplier reward pool portion
        uint256 feeAdjustedMultiplier = multiplier - (multiplier * protocolFeeBps) / 10000;

        // 2. Increment active running pools
        if (position == Position.Up) {
            activeUpPool += msg.value;
        } else {
            activeDownPool += msg.value;
        }

        // 3. Register bet
        totalBetsCount++;
        uint256 expiry = block.timestamp + 60;

        bets[totalBetsCount] = Bet({
            betId: totalBetsCount,
            user: msg.sender,
            position: position,
            stake: msg.value,
            entryTime: block.timestamp,
            expiryTime: expiry,
            entryPrice: latestPrice,
            settlementPrice: 0,
            lockedMultiplier: feeAdjustedMultiplier,
            status: Status.Running,
            payout: 0,
            claimed: false
        });

        userBets[msg.sender].push(totalBetsCount);

        emit BetPlaced(
            totalBetsCount,
            msg.sender,
            position,
            msg.value,
            latestPrice,
            feeAdjustedMultiplier,
            block.timestamp,
            expiry
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        VIEW & UTILS
    // ═══════════════════════════════════════════════════════════════════

    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }

    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }

    /**
     * @notice Helper to get current dynamic multipliers for the UI
     */
    function getLiveMultipliers() external view returns (uint256 upMultiplier, uint256 downMultiplier) {
        uint256 currentUpTotal = activeUpPool + virtualUp;
        uint256 currentDownTotal = activeDownPool + virtualDown;
        uint256 currentTotal = currentUpTotal + currentDownTotal;

        uint256 rawUp = (currentTotal * 10000) / currentUpTotal;
        uint256 rawDown = (currentTotal * 10000) / currentDownTotal;

        if (rawUp < 11000) rawUp = 11000;
        if (rawUp > 100000) rawUp = 100000;
        if (rawDown < 11000) rawDown = 11000;
        if (rawDown > 100000) rawDown = 100000;

        upMultiplier = rawUp - (rawUp * protocolFeeBps) / 10000;
        downMultiplier = rawDown - (rawDown * protocolFeeBps) / 10000;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                        ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "CM: zero address");
        emit KeeperUpdated(keeperAddress, _keeper);
        keeperAddress = _keeper;
    }

    function setProtocolFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "CM: fee exceeds 10%");
        protocolFeeBps = _feeBps;
    }

    function setVirtualPools(uint256 _virtualUp, uint256 _virtualDown) external onlyOwner {
        require(_virtualUp > 0 && _virtualDown > 0, "CM: zero virtual pool");
        virtualUp = _virtualUp;
        virtualDown = _virtualDown;
    }

    function setMinBetAmount(uint256 _minBet) external onlyOwner {
        minBetAmount = _minBet;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /**
     * @notice Reclaims accumulated fees or emergency balance recovery.
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(amount <= balance, "CM: insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "CM: withdraw transfer failed");
    }

    // Allow contract to receive USDC gas tokens
    receive() external payable {}
}
