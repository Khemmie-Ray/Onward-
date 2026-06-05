// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {
    UUPSUpgradeable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {
    Initializable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOnwardBadgesReserve {
    function replenishReserve(uint256 amount, string calldata source) external;
}

contract WhackStake is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============================================================
    // Types
    // ============================================================

    struct Stake {
        address staker;
        uint256 amount;
        bool resolved;
    }

    // ============================================================
    // State
    // ============================================================

    /// @notice The backend wallet authorized to resolve rounds.
    address public signer;

    /// @notice The G$ ERC-20 token.
    IERC20 public gDollar;

    /// @notice The OnwardBadges contract — destination for forfeited stakes.
    IOnwardBadgesReserve public badges;

    /// @notice Required stake amount per round, in G$ wei (18 decimals).
    uint256 public stakeAmount;

    /// @notice Bonus paid on win, in G$ wei.
    uint256 public bonusAmount;

    /// @notice roundId → Stake
    mapping(bytes32 => Stake) public stakes;

    /// @notice Lifetime metric: total stakes accepted.
    uint256 public totalStaked;

    /// @notice Lifetime metric: total stakes refunded to winners.
    uint256 public totalRefunded;

    /// @notice Lifetime metric: total bonuses paid to winners.
    uint256 public totalBonusPaid;

    /// @notice Lifetime metric: total stakes forfeited to OnwardBadges reserve.
    uint256 public totalForfeited;

    /// @notice Flag for permanent upgrade renunciation.
    bool public upgradeRenounced;

    /// @dev Storage gap for future versions.
    uint256[40] private __gap;

    // ============================================================
    // Events
    // ============================================================

    event Staked(
        address indexed staker,
        bytes32 indexed roundId,
        uint256 amount
    );
    event RoundWon(
        address indexed staker,
        bytes32 indexed roundId,
        uint256 stakeRefunded,
        uint256 bonusPaid
    );
    event RoundLost(
        address indexed staker,
        bytes32 indexed roundId,
        uint256 amountForfeited
    );
    event SignerChanged(
        address indexed previousSigner,
        address indexed newSigner
    );
    event StakeAmountChanged(uint256 previousAmount, uint256 newAmount);
    event BonusAmountChanged(uint256 previousAmount, uint256 newAmount);
    event BadgesAddressChanged(
        address indexed previousBadges,
        address indexed newBadges
    );
    event BonusPoolFunded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event UpgradeRenounced();

    // ============================================================
    // Errors
    // ============================================================

    error NotSigner();
    error WrongStakeAmount();
    error RoundAlreadyExists();
    error RoundNotFound();
    error RoundAlreadyResolved();
    error TransferFailed();
    error ZeroAddress();
    error ZeroAmount();
    error UpgradeAlreadyRenounced();

    // ============================================================
    // Modifiers
    // ============================================================

    modifier onlySigner() {
        _onlySigner();
        _;
    }

    function _onlySigner() internal {
        if (msg.sender != signer) revert NotSigner();
    }

    // ============================================================
    // Initializer
    // ============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param _owner Multisig that controls config + upgrade authority
     * @param _signer Backend wallet authorized to resolve rounds
     * @param _gDollar G$ ERC-20 address
     * @param _badges OnwardBadges contract address (forfeit destination)
     * @param _stakeAmount Required stake per round in wei (e.g. 10 G$ = 10e18)
     * @param _bonusAmount Bonus paid on win in wei (e.g. 5 G$ = 5e18)
     */
    function initialize(
        address _owner,
        address _signer,
        address _gDollar,
        address _badges,
        uint256 _stakeAmount,
        uint256 _bonusAmount
    ) external initializer {
        if (
            _owner == address(0) ||
            _signer == address(0) ||
            _gDollar == address(0) ||
            _badges == address(0)
        ) {
            revert ZeroAddress();
        }
        if (_stakeAmount == 0) revert ZeroAmount();

        __Ownable_init(_owner);
        __Pausable_init();

        signer = _signer;
        gDollar = IERC20(_gDollar);
        badges = IOnwardBadgesReserve(_badges);
        stakeAmount = _stakeAmount;
        bonusAmount = _bonusAmount;
    }

    // ============================================================
    // Staking — user-callable
    // ============================================================

    /**
     * @notice Stake G$ for a premium round. User must approve this contract for `stakeAmount` G$ first.
     * @param roundId Server-generated identifier for this round (UUID hash, etc.)
     * @dev RoundId must be unique. Re-using a roundId reverts.
     */
    function stake(bytes32 roundId) external whenNotPaused {
        if (stakes[roundId].staker != address(0)) revert RoundAlreadyExists();

        uint256 amount = stakeAmount;
        bool ok = gDollar.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        stakes[roundId] = Stake({
            staker: msg.sender,
            amount: amount,
            resolved: false
        });
        totalStaked += amount;

        emit Staked(msg.sender, roundId, amount);
    }

    // ============================================================
    // Round resolution — signer-only
    // ============================================================

    /**
     * @notice Resolve a round. Backend calls this after the game ends.
     * @param roundId The round identifier
     * @param didWin Whether the staker passed
     * @dev On win: stake refunded + bonus paid from bonus pool.
     *      On loss: stake forwarded to OnwardBadges via replenishReserve().
     */
    function resolve(
        bytes32 roundId,
        bool didWin
    ) external onlySigner whenNotPaused {
        Stake storage s = stakes[roundId];
        if (s.staker == address(0)) revert RoundNotFound();
        if (s.resolved) revert RoundAlreadyResolved();

        s.resolved = true;
        uint256 amount = s.amount;
        address staker = s.staker;

        if (didWin) {
            // Refund stake
            bool ok1 = gDollar.transfer(staker, amount);
            if (!ok1) revert TransferFailed();
            totalRefunded += amount;

            // Pay bonus from this contract's bonus pool
            if (bonusAmount > 0) {
                bool ok2 = gDollar.transfer(staker, bonusAmount);
                if (!ok2) revert TransferFailed();
                totalBonusPaid += bonusAmount;
            }

            emit RoundWon(staker, roundId, amount, bonusAmount);
        } else {
            // Approve OnwardBadges to pull the forfeit
            bool ok1 = gDollar.approve(address(badges), amount);
            if (!ok1) revert TransferFailed();
            badges.replenishReserve(amount, "whack-stake-forfeit");
            totalForfeited += amount;

            emit RoundLost(staker, roundId, amount);
        }
    }

    // ============================================================
    // Bonus pool funding (any caller — typically owner or auto-replenish)
    // ============================================================

    /**
     * @notice Top up the bonus pool. Caller must approve this contract for `amount` first.
     */
    function fundBonusPool(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        bool ok = gDollar.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit BonusPoolFunded(msg.sender, amount);
    }

    // ============================================================
    // Admin (owner-only)
    // ============================================================

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerChanged(signer, newSigner);
        signer = newSigner;
    }

    function setStakeAmount(uint256 newAmount) external onlyOwner {
        if (newAmount == 0) revert ZeroAmount();
        emit StakeAmountChanged(stakeAmount, newAmount);
        stakeAmount = newAmount;
    }

    function setBonusAmount(uint256 newAmount) external onlyOwner {
        emit BonusAmountChanged(bonusAmount, newAmount);
        bonusAmount = newAmount;
    }

    function setBadgesAddress(address newBadges) external onlyOwner {
        if (newBadges == address(0)) revert ZeroAddress();
        emit BadgesAddressChanged(address(badges), newBadges);
        badges = IOnwardBadgesReserve(newBadges);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        bool ok = gDollar.transfer(to, amount);
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    // ============================================================
    // Upgrade authority
    // ============================================================

    function _authorizeUpgrade(address) internal view override onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
    }

    function renounceUpgradeability() external onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
        upgradeRenounced = true;
        emit UpgradeRenounced();
    }

    // ============================================================
    // View helpers
    // ============================================================

    function contractBalance() external view returns (uint256) {
        return gDollar.balanceOf(address(this));
    }

    function bonusPoolBalance() external view returns (uint256) {
        // Total balance minus outstanding (un-resolved) stakes.
        // Not tracked explicitly; this is a fair approximation:
        // bonusPool ≈ contractBalance - (totalStaked - totalRefunded - totalForfeited)
        uint256 bal = gDollar.balanceOf(address(this));
        uint256 outstanding = totalStaked - totalRefunded - totalForfeited;
        return bal > outstanding ? bal - outstanding : 0;
    }
}
