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
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IIdentity {
    function getWhitelistedRoot(
        address account
    ) external view returns (address);
}


contract OnwardClaims is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardLite,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    address public signer;
    IERC20 public gDollar;
    IIdentity public identity;

    /// @notice Points required per 1 G$ (scaled by RATE_SCALE).
    /// @dev RATE_SCALE = 1e18. rate 1e18 means 1 point = 1 G$.
    uint256 public pointsPerG;

    uint256 public minClaimPoints;
    uint256 public perUserDailyCapG;
    uint256 public perUserWeeklyCapG;
    uint256 public globalDailyCapG;

    /// @notice Cumulative G$ settled from points. Feeds volume reporting.
    uint256 public totalClaimedG;
    /// @notice Cumulative UBI claimed through Onward, recorded by the signer.
    uint256 public totalUbiClaimedG;
    /// @notice Number of settle() calls that paid out.
    uint256 public claimCount;
    /// @notice Cumulative points burned through settlement.
    uint256 public totalPointsSettled;

    mapping(bytes32 => bool) public settled;

    /// @dev user => dayIndex => G$ settled that day
    mapping(address => mapping(uint256 => uint256)) public userDailyClaimed;
    /// @dev user => weekIndex => G$ settled that week
    mapping(address => mapping(uint256 => uint256)) public userWeeklyClaimed;
    /// @dev dayIndex => G$ settled across all users that day
    mapping(uint256 => uint256) public globalDailyClaimed;

    bool public upgradeRenounced;

    /// @notice Cumulative G$ paid out as contest rewards via batchContestReward.
    /// @dev Tracked separately from totalClaimedG so contest payouts can be
    ///      counted or excluded from volume independently. Added in the V2
    ///      upgrade: it consumes one slot from the original __gap, which is why
    ///      __gap went from [40] to [39].
    uint256 public totalContestPaidG;

    uint256[39] private __gap;

    uint256 public constant RATE_SCALE = 1e18;
    uint256 private constant DAY = 1 days;
    uint256 private constant WEEK = 7 days;

    event Claimed(
        address indexed user,
        uint256 points,
        uint256 gAmount,
        bytes32 indexed claimId
    );
    event UbiRecorded(
        address indexed user,
        uint256 amount,
        bytes32 indexed txRef
    );
    event ReserveFunded(address indexed from, uint256 amount);
    event ReserveWithdrawn(address indexed to, uint256 amount);
    event SignerChanged(address indexed previous, address indexed current);
    event IdentityChanged(address indexed previous, address indexed current);
    event RateChanged(uint256 previous, uint256 current);
    event LimitsChanged(
        uint256 minClaimPoints,
        uint256 perUserDailyCapG,
        uint256 perUserWeeklyCapG,
        uint256 globalDailyCapG
    );
    event UpgradeRenounced();
    /// @notice Emitted once per recipient in a contest payout batch.
    event ContestRewardPaid(
        address indexed user,
        uint256 amount,
        bytes32 indexed batchRef
    );

    error NotSigner();
    error ZeroAddress();
    error ZeroAmount();
    error NotVerified();
    error BelowMinimum();
    error ExceedsUserDailyCap();
    error ExceedsUserWeeklyCap();
    error ExceedsGlobalDailyCap();
    error InsufficientReserve();
    error AlreadySettled();
    error InvalidRate();
    error UpgradeAlreadyRenounced();
    error LengthMismatch();
    error EmptyBatch();

    modifier onlySigner() {
        if (msg.sender != signer) revert NotSigner();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _signer,
        address _gDollar,
        address _identity
    ) external initializer {
        if (
            _owner == address(0) ||
            _signer == address(0) ||
            _gDollar == address(0) ||
            _identity == address(0)
        ) revert ZeroAddress();

        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();

        signer = _signer;
        gDollar = IERC20(_gDollar);
        identity = IIdentity(_identity);

        pointsPerG = RATE_SCALE;

        minClaimPoints = 100;
        perUserDailyCapG = 200e18;
        perUserWeeklyCapG = 1000e18;
        globalDailyCapG = 20000e18;
    }

   /**
     * @notice Convert a user's points into G$ and send it to them.
     * @dev Verification is read on-chain here, never trusted from the caller.
     * @param user Recipient wallet.
     * @param points Points being redeemed.
     * @param claimId Unique per claim; reuse reverts, so retries can't double-pay.
     * @return gAmount G$ transferred, in wei.
     */
    function settle(
        address user,
        uint256 points,
        bytes32 claimId
    ) external onlySigner whenNotPaused nonReentrant returns (uint256 gAmount) {
        if (user == address(0)) revert ZeroAddress();
        if (points == 0) revert ZeroAmount();
        if (settled[claimId]) revert AlreadySettled();
        if (points < minClaimPoints) revert BelowMinimum();
        if (!isVerified(user)) revert NotVerified();

        gAmount = pointsToG(points);
        if (gAmount == 0) revert ZeroAmount();

        uint256 dayIdx = _dayIndex();
        uint256 weekIdx = _weekIndex();

        if (userDailyClaimed[user][dayIdx] + gAmount > perUserDailyCapG) {
            revert ExceedsUserDailyCap();
        }
        if (userWeeklyClaimed[user][weekIdx] + gAmount > perUserWeeklyCapG) {
            revert ExceedsUserWeeklyCap();
        }
        if (globalDailyClaimed[dayIdx] + gAmount > globalDailyCapG) {
            revert ExceedsGlobalDailyCap();
        }
        if (gDollar.balanceOf(address(this)) < gAmount) {
            revert InsufficientReserve();
        }

        settled[claimId] = true;
        userDailyClaimed[user][dayIdx] += gAmount;
        userWeeklyClaimed[user][weekIdx] += gAmount;
        globalDailyClaimed[dayIdx] += gAmount;

        totalClaimedG += gAmount;
        totalPointsSettled += points;
        claimCount += 1;

        gDollar.safeTransfer(user, gAmount);

        emit Claimed(user, points, gAmount, claimId);
    }

    /**
     * @notice Pay contest rewards to many winners in one transaction.
     * @dev Owner-only (not signer): this moves large sums and bypasses the
     *      per-user settle() caps, so it is gated to the most privileged key.
     *      No on-chain idempotency: running the same batch twice pays twice.
     *      batchRef only tags a batch for off-chain tracking.
     *
     * @param recipients Winner wallets.
     * @param amounts    G$ (wei) for each recipient, index-aligned.
     * @param batchRef   Opaque tag for this batch, emitted per payment.
     */
    function batchContestReward(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 batchRef
    ) external onlyOwner whenNotPaused nonReentrant {
        uint256 n = recipients.length;
        if (n == 0) revert EmptyBatch();
        if (n != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i; i < n; ++i) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
        }
        if (gDollar.balanceOf(address(this)) < total) {
            revert InsufficientReserve();
        }

        totalContestPaidG += total;

        for (uint256 i; i < n; ++i) {
            gDollar.safeTransfer(recipients[i], amounts[i]);
            emit ContestRewardPaid(recipients[i], amounts[i], batchRef);
        }
    }

    /**
     * @notice Record a UBI claim Onward sponsored, for volume tracking.
     * @dev UBI is claimed from GoodDollar's contract, so this can't observe it
     *      directly; the signer attests the amount. An attestation, not a proof.
     */
    function recordUbiClaim(
        address user,
        uint256 amount,
        bytes32 txRef
    ) external onlySigner whenNotPaused {
        if (user == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        totalUbiClaimedG += amount;

        emit UbiRecorded(user, amount, txRef);
    }

    /// @notice Total G$ volume Onward has moved: settlements plus sponsored UBI.
    function totalVolumeG() external view returns (uint256) {
        return totalClaimedG + totalUbiClaimedG;
    }

    /// @notice Whether a wallet is GoodDollar-verified, read on-chain.
    function isVerified(address user) public view returns (bool) {
        try identity.getWhitelistedRoot(user) returns (address root) {
            return root != address(0);
        } catch {
            return false;
        }
    }

    /**
     * @notice G$ (wei) a given points balance is worth at the current rate.
     * @dev points * 1e18 (G$ decimals) * RATE_SCALE / pointsPerG.
     *      At pointsPerG = 1e18, 100 points returns 100e18 wei = 100 G$.
     */
    function pointsToG(uint256 points) public view returns (uint256) {
        return (points * 1e18 * RATE_SCALE) / pointsPerG;
    }

    function reserveBalance() external view returns (uint256) {
        return gDollar.balanceOf(address(this));
    }

    /**
     * @notice What a user could settle right now, in G$ wei.
     * @dev Min of remaining daily allowance, weekly allowance, remaining
     *      global allowance and the reserve. Lets the UI say "you can claim X"
     *      instead of letting them submit and revert.
     */
    function claimableNow(address user) external view returns (uint256) {
        if (!isVerified(user)) return 0;

        uint256 dayIdx = _dayIndex();
        uint256 weekIdx = _weekIndex();

        uint256 dailyLeft = perUserDailyCapG > userDailyClaimed[user][dayIdx]
            ? perUserDailyCapG - userDailyClaimed[user][dayIdx]
            : 0;
        uint256 weeklyLeft = perUserWeeklyCapG >
            userWeeklyClaimed[user][weekIdx]
            ? perUserWeeklyCapG - userWeeklyClaimed[user][weekIdx]
            : 0;
        uint256 globalLeft = globalDailyCapG > globalDailyClaimed[dayIdx]
            ? globalDailyCapG - globalDailyClaimed[dayIdx]
            : 0;

        uint256 limit = dailyLeft < weeklyLeft ? dailyLeft : weeklyLeft;
        if (globalLeft < limit) limit = globalLeft;

        uint256 reserve = gDollar.balanceOf(address(this));
        if (reserve < limit) limit = reserve;

        return limit;
    }

    function userClaimedToday(address user) external view returns (uint256) {
        return userDailyClaimed[user][_dayIndex()];
    }

    function userClaimedThisWeek(address user) external view returns (uint256) {
        return userWeeklyClaimed[user][_weekIndex()];
    }

    function claimedGloballyToday() external view returns (uint256) {
        return globalDailyClaimed[_dayIndex()];
    }

    /**
     * @notice Pull G$ into the reserve. Caller must approve first.
     * @dev Anyone may fund; only the owner may withdraw.
     */
    function fundReserve(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        gDollar.safeTransferFrom(msg.sender, address(this), amount);
        emit ReserveFunded(msg.sender, amount);
    }

    function withdrawReserve(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (gDollar.balanceOf(address(this)) < amount) {
            revert InsufficientReserve();
        }
        gDollar.safeTransfer(to, amount);
        emit ReserveWithdrawn(to, amount);
    }

    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        emit SignerChanged(signer, _signer);
        signer = _signer;
    }

    /**
     * @notice Point at a different GoodDollar identity contract.
     * @dev Settable rather than hardcoded so a GoodDollar migration does not
     *      require redeploying this contract.
     */
    function setIdentity(address _identity) external onlyOwner {
        if (_identity == address(0)) revert ZeroAddress();
        emit IdentityChanged(address(identity), _identity);
        identity = IIdentity(_identity);
    }

    /**
     * @param _pointsPerG Scaled by RATE_SCALE. 1e18 = 1 point per G$;
     *        10e18 = 10 points per G$.
     */
    function setRate(uint256 _pointsPerG) external onlyOwner {
        if (_pointsPerG == 0) revert InvalidRate();
        emit RateChanged(pointsPerG, _pointsPerG);
        pointsPerG = _pointsPerG;
    }

    function setLimits(
        uint256 _minClaimPoints,
        uint256 _perUserDailyCapG,
        uint256 _perUserWeeklyCapG,
        uint256 _globalDailyCapG
    ) external onlyOwner {
        minClaimPoints = _minClaimPoints;
        perUserDailyCapG = _perUserDailyCapG;
        perUserWeeklyCapG = _perUserWeeklyCapG;
        globalDailyCapG = _globalDailyCapG;

        emit LimitsChanged(
            _minClaimPoints,
            _perUserDailyCapG,
            _perUserWeeklyCapG,
            _globalDailyCapG
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _dayIndex() internal view returns (uint256) {
        return block.timestamp / DAY;
    }

    function _weekIndex() internal view returns (uint256) {
        return block.timestamp / WEEK;
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
    }

    function renounceUpgradeability() external onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
        upgradeRenounced = true;
        emit UpgradeRenounced();
    }
}