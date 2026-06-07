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
import {
    ERC721Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OnwardBadges is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardLite,
    UUPSUpgradeable,
    ERC721Upgradeable
{
    using SafeERC20 for IERC20;

    // ============================================================
    // State (do not reorder — UUPS upgrade safety)
    // ============================================================

    address public signer;
    IERC20 public gDollar;
    uint256 public nextTokenId;

    mapping(address => mapping(bytes32 => uint256)) public earnedTokenId;
    mapping(bytes32 => string) public moduleTokenURI;
    mapping(bytes32 => bool) public claimed;
    mapping(address => uint256) public pendingClaim;
    mapping(uint256 => bytes32) public tokenSlug;

    uint256 public totalDistributed;
    uint256 public totalAccrued;
    uint256 public totalClaimed;
    uint256 public totalPending;

    bool public upgradeRenounced;

    uint256[40] private __gap;

    // ============================================================
    // Events
    // ============================================================

    event BadgeMinted(
        address indexed user,
        bytes32 indexed slugHash,
        uint256 indexed tokenId,
        string slug
    );
    event RewardDistributed(
        address indexed user,
        uint256 amount,
        bytes32 indexed claimId,
        string slug
    );
    event RewardAccrued(
        address indexed user,
        uint256 amount,
        bytes32 indexed claimId,
        string slug
    );
    event PendingClaimed(
        address indexed user,
        uint256 amount,
        address indexed triggeredBy
    );
    event ReserveReplenished(
        address indexed from,
        uint256 amount,
        string source
    );
    event SignerChanged(address indexed previous, address indexed current);
    event ModuleURIChanged(bytes32 indexed slugHash, string uri);
    event EmergencyWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    event UpgradeRenounced();

    // ============================================================
    // Errors
    // ============================================================

    error NotSigner();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientReserve();
    error NoPendingClaim();
    error SoulboundCannotTransfer();
    error UpgradeAlreadyRenounced();

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
        address _gDollar
    ) external initializer {
        if (
            _owner == address(0) ||
            _signer == address(0) ||
            _gDollar == address(0)
        ) revert ZeroAddress();

        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __ERC721_init("Onward Badge", "ONWARD");

        signer = _signer;
        gDollar = IERC20(_gDollar);
        nextTokenId = 1;
    }

    // ============================================================
    // Backend operations (signer-only)
    // ============================================================

    /**
     * @notice One-shot: mint badge + distribute or accrue reward.
     * @param user Recipient
     * @param slug Module slug (e.g. "what-is-gooddollar")
     * @param rewardAmount G$ in wei
     * @param claimId Unique per (user, module). Reused = no-op.
     * @param isVerified Frontend-determined verification status.
     *                   true → direct payout; false → accrue to pending.
     * @return tokenId Badge token ID (new or existing).
     * @return wasPaidDirect true if G$ transferred now, false if accrued.
     */
    function processCompletion(
        address user,
        string calldata slug,
        uint256 rewardAmount,
        bytes32 claimId,
        bool isVerified
    )
        external
        onlySigner
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId, bool wasPaidDirect)
    {
        tokenId = _mintBadge(user, slug);
        wasPaidDirect = _distribute(
            user,
            rewardAmount,
            claimId,
            slug,
            isVerified
        );
    }

    function mint(
        address user,
        string calldata slug
    ) external onlySigner whenNotPaused nonReentrant returns (uint256 tokenId) {
        return _mintBadge(user, slug);
    }

    function distribute(
        address user,
        uint256 amount,
        bytes32 claimId,
        string calldata slug,
        bool isVerified
    )
        external
        onlySigner
        whenNotPaused
        nonReentrant
        returns (bool wasPaidDirect)
    {
        return _distribute(user, amount, claimId, slug, isVerified);
    }

    /**
     * @notice Release accumulated pending balance to a user.
     * @dev Signer-only. Backend should verify user is whitelisted via
     *      citizen-sdk before calling. User pays no gas.
     * @param user Address whose pending balance to release.
     */
    function claimPending(
        address user
    ) external onlySigner whenNotPaused nonReentrant {
        if (user == address(0)) revert ZeroAddress();

        uint256 amount = pendingClaim[user];
        if (amount == 0) revert NoPendingClaim();
        if (gDollar.balanceOf(address(this)) < amount) {
            revert InsufficientReserve();
        }

        // Effects before interaction (CEI)
        pendingClaim[user] = 0;
        totalPending -= amount;
        totalClaimed += amount;

        // Interaction (last)
        gDollar.safeTransfer(user, amount);

        emit PendingClaimed(user, amount, msg.sender);
    }

    // ============================================================
    // Reserve funding (open — anyone can replenish)
    // ============================================================

    function replenishReserve(
        uint256 amount,
        string calldata source
    ) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        gDollar.safeTransferFrom(msg.sender, address(this), amount);
        emit ReserveReplenished(msg.sender, amount, source);
    }

    // ============================================================
    // View helpers
    // ============================================================

    function reserveBalance() external view returns (uint256) {
        return gDollar.balanceOf(address(this));
    }

    function availableReserve() external view returns (uint256) {
        uint256 bal = gDollar.balanceOf(address(this));
        return bal > totalPending ? bal - totalPending : 0;
    }

    function slugHashOf(string calldata slug) external pure returns (bytes32) {
        return keccak256(bytes(slug));
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return moduleTokenURI[tokenSlug[tokenId]];
    }

    // ============================================================
    // Soulbound enforcement
    // ============================================================

    /// @dev Block transfers. Mint (from=0) and burn (to=0) allowed.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundCannotTransfer();
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert SoulboundCannotTransfer();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundCannotTransfer();
    }

    // ============================================================
    // Admin (owner-only)
    // ============================================================

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerChanged(signer, newSigner);
        signer = newSigner;
    }

    function setModuleURI(
        string calldata slug,
        string calldata uri
    ) external onlyOwner {
        bytes32 h = keccak256(bytes(slug));
        moduleTokenURI[h] = uri;
        emit ModuleURIChanged(h, uri);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw stuck tokens. G$ withdrawals cannot dip below totalPending.
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        if (token == address(gDollar)) {
            uint256 bal = gDollar.balanceOf(address(this));
            if (bal < amount) revert InsufficientReserve();
            if (bal - amount < totalPending) revert InsufficientReserve();
        }

        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdrawn(token, to, amount);
    }

    // ============================================================
    // Internal logic
    // ============================================================

    function _mintBadge(
        address user,
        string calldata slug
    ) internal returns (uint256 tokenId) {
        if (user == address(0)) revert ZeroAddress();

        bytes32 h = keccak256(bytes(slug));
        uint256 existing = earnedTokenId[user][h];
        if (existing != 0) return existing;

        tokenId = nextTokenId++;
        earnedTokenId[user][h] = tokenId;
        tokenSlug[tokenId] = h;
        _safeMint(user, tokenId);

        emit BadgeMinted(user, h, tokenId, slug);
    }

    function _distribute(
        address user,
        uint256 amount,
        bytes32 claimId,
        string calldata slug,
        bool isVerified
    ) internal returns (bool wasPaidDirect) {
        if (user == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (claimed[claimId]) return false;

        claimed[claimId] = true;

        if (isVerified) {
            uint256 bal = gDollar.balanceOf(address(this));
            if (bal < amount + totalPending) revert InsufficientReserve();

            totalDistributed += amount;

            gDollar.safeTransfer(user, amount);

            emit RewardDistributed(user, amount, claimId, slug);
            return true;
        } else {
            pendingClaim[user] += amount;
            totalPending += amount;
            totalAccrued += amount;

            emit RewardAccrued(user, amount, claimId, slug);
            return false;
        }
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
