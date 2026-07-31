// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardLite} from "./ReentrancyGuardLite.sol";
import {
    UUPSUpgradeable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {
    Initializable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IOnwardBadgesReserve {
    function replenishReserve(uint256 amount, string calldata source) external;
}

contract WhackStake is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardLite,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    struct Stake {
        address staker;
        uint256 amount;
        bool resolved;
    }

    // ============================================================
    // State (do not reorder)
    // ============================================================

    address public signer;
    IERC20 public gDollar;
    IOnwardBadgesReserve public badges;

    uint256 public stakeAmount;
    uint256 public bonusAmount;

    mapping(bytes32 => Stake) public stakes;

    uint256 public totalStaked;
    uint256 public totalRefunded;
    uint256 public totalBonusPaid;
    uint256 public totalForfeited;

    bool public upgradeRenounced;

    // V2: pointer to a user's single unresolved stake. 
    mapping(address => bytes32) public activeStakeOf;

    uint256[39] private __gap;

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
    event SignerChanged(address indexed previous, address indexed current);
    event StakeAmountChanged(uint256 previous, uint256 current);
    event BonusAmountChanged(uint256 previous, uint256 current);
    event BadgesAddressChanged(
        address indexed previous,
        address indexed current
    );
    event BonusPoolFunded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event UpgradeRenounced();

    // ============================================================
    // Errors
    // ============================================================

    error NotSigner();
    error ZeroAddress();
    error ZeroAmount();
    error RoundAlreadyExists();
    error RoundNotFound();
    error RoundAlreadyResolved();
    error InsufficientBonusPool();
    error UpgradeAlreadyRenounced();
    error ActiveStakeExists(); 

    // ============================================================
    // Modifiers
    // ============================================================

    modifier onlySigner() {
        if (msg.sender != signer) revert NotSigner();
        _;
    }

    // ============================================================
    // Initializer
    // ============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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
        ) revert ZeroAddress();
        if (_stakeAmount == 0) revert ZeroAmount();

        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();

        signer = _signer;
        gDollar = IERC20(_gDollar);
        badges = IOnwardBadgesReserve(_badges);
        stakeAmount = _stakeAmount;
        bonusAmount = _bonusAmount;
    }

    // ============================================================
    // Staking — anyone can stake (frontend gates verification)
    // ============================================================

    function stake(
        bytes32 roundId
    ) external whenNotPaused nonReentrant {
        if (stakes[roundId].staker != address(0)) revert RoundAlreadyExists();
        // V2: enforce one unresolved stake per user. 
        if (activeStakeOf[msg.sender] != bytes32(0)) revert ActiveStakeExists();

        uint256 amount = stakeAmount;

        // V2: record this as the user's active stake.
        activeStakeOf[msg.sender] = roundId;

        stakes[roundId] = Stake({
            staker: msg.sender,
            amount: amount,
            resolved: false
        });
        totalStaked += amount;

        gDollar.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, roundId, amount);
    }

    // ============================================================
    // Round resolution — signer-only
    // ============================================================

    function resolve(
        bytes32 roundId,
        bool didWin
    ) external onlySigner whenNotPaused nonReentrant {
        Stake storage s = stakes[roundId];
        if (s.staker == address(0)) revert RoundNotFound();
        if (s.resolved) revert RoundAlreadyResolved();

        uint256 amount = s.amount;
        address staker = s.staker;

        s.resolved = true;
        // V2: clear the user's active-stake pointer now that it's resolved.
        delete activeStakeOf[staker];

        if (didWin) {
            totalRefunded += amount;
            if (bonusAmount > 0) {
                uint256 outstanding = totalStaked -
                    totalRefunded -
                    totalForfeited;
                uint256 bal = gDollar.balanceOf(address(this));
                if (bal < amount + outstanding + bonusAmount) {
                    revert InsufficientBonusPool();
                }
                totalBonusPaid += bonusAmount;
            }

            gDollar.safeTransfer(staker, amount);
            if (bonusAmount > 0) {
                gDollar.safeTransfer(staker, bonusAmount);
            }

            emit RoundWon(staker, roundId, amount, bonusAmount);
        } else {
            totalForfeited += amount;

            gDollar.forceApprove(address(badges), amount);
            badges.replenishReserve(amount, "whack-stake-forfeit");

            emit RoundLost(staker, roundId, amount);
        }
    }

    // ============================================================
    // Bonus pool funding
    // ============================================================

    function fundBonusPool(
        uint256 amount
    ) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        gDollar.safeTransferFrom(msg.sender, address(this), amount);
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

    /// @notice Owner withdrawal cannot touch outstanding unresolved stakes.
    function withdraw(
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 outstanding = totalStaked - totalRefunded - totalForfeited;
        uint256 bal = gDollar.balanceOf(address(this));
        if (bal < amount) revert InsufficientBonusPool();
        if (bal - amount < outstanding) revert InsufficientBonusPool();

        gDollar.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }

    // ============================================================
    // View helpers
    // ============================================================

    function contractBalance() external view returns (uint256) {
        return gDollar.balanceOf(address(this));
    }

    function bonusPoolBalance() external view returns (uint256) {
        uint256 bal = gDollar.balanceOf(address(this));
        uint256 outstanding = totalStaked - totalRefunded - totalForfeited;
        return bal > outstanding ? bal - outstanding : 0;
    }

    // V2: one read for the app — the user's active unresolved stake, if any.
    function getActiveStake(address user)
        external
        view
        returns (bytes32 roundId, uint256 amount, bool exists)
    {
        roundId = activeStakeOf[user];
        exists = roundId != bytes32(0);
        amount = exists ? stakes[roundId].amount : 0;
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
}