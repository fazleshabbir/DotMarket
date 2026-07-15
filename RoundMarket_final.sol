// Sources flattened with hardhat v2.28.6 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/StorageSlot.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.


/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)


/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File contracts/RoundMarket.sol

// Original license: SPDX_License_Identifier: MIT


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
        // Ensure the previous round is locked or canceled before starting a new one
        if (currentRoundId > 0) {
            Round storage prev = rounds[currentRoundId];
            require(
                prev.startPrice > 0 || prev.canceled,
                "RM: previous round not locked"
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
     * @notice Lock current round and open the next round in a single atomic transaction.
     * @param  roundToLock  The round ID to lock
     * @param  lockPrice    The price of the asset at lock time
     */
    function lockAndOpenRound(uint256 roundToLock, int256 lockPrice) external onlyKeeper whenNotPaused {
        require(roundToLock == currentRoundId, "RM: lock target must be current round");

        // 1. Lock the specified round
        lockRound(roundToLock, lockPrice);

        // 2. Open the next round
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
