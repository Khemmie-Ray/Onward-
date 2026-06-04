// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    ERC721Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
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

contract OnwardBadges is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============================================================
    // State variables
    // ============================================================

    /// @notice The backend wallet authorized to mint badges and distribute rewards.
    address public signer;

    /// @notice The G$ ERC-20 token contract.
    IERC20 public gDollar;

    /// @notice Auto-incrementing token ID counter. Starts at 1 (0 is sentinel for "not owned").
    uint256 public nextTokenId;

    /// @notice slug hash → token metadata URI
    mapping(bytes32 => string) public moduleTokenURI;

    /// @notice user address → slug hash → tokenId (0 means not earned)
    mapping(address => mapping(bytes32 => uint256)) public earnedTokenId;

    /// @notice tokenId → slug hash (reverse lookup)
    mapping(uint256 => bytes32) public tokenIdToSlugHash;

    /// @notice claim ID → has been paid out
    mapping(bytes32 => bool) public claimed;

    /// @notice Lifetime G$ distributed via this contract (pitch metric).
    uint256 public totalDistributed;

    /// @notice Lifetime G$ flowed in from WhackStake forfeits.
    uint256 public totalReplenished;

    /// @notice Flag for permanent upgrade renunciation.
    bool public upgradeRenounced;

    /// @dev Storage gap reserved for future versions. Decrement when adding new state vars.
    uint256[42] private __gap;

    // ============================================================
    // Events
    // ============================================================

    event BadgeMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed slugHash
    );
    event RewardDistributed(
        address indexed to,
        uint256 amount,
        bytes32 indexed claimId
    );
    event ReserveReplenished(
        address indexed from,
        uint256 amount,
        string source
    );
    event ModuleURISet(bytes32 indexed slugHash, string uri);
    event SignerChanged(
        address indexed previousSigner,
        address indexed newSigner
    );
    event UpgradeRenounced();
    event Withdrawn(address indexed to, uint256 amount);

    // ============================================================
    // Errors
    // ============================================================

    error NotSigner();
    error AlreadyEarned();
    error AlreadyClaimed();
    error URINotConfigured();
    error TransferFailed();
    error SoulboundCannotTransfer();
    error UpgradeAlreadyRenounced();
    error ZeroAddress();
    error ZeroAmount();

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
     * @param _owner Multisig that controls config, pause, upgrade authority
     * @param _signer Backend wallet authorized to mint + distribute
     * @param _gDollar G$ ERC-20 address on the target chain
     */
    function initialize(
        address _owner,
        address _signer,
        address _gDollar
    ) external initializer {
        if (
            _owner == address(0) ||
            _signer == address(0) ||
            _gDollar == address(0)
        ) {
            revert ZeroAddress();
        }

        __ERC721_init("Onward Badges", "ONWARD");
        __Ownable_init(_owner);
        __Pausable_init();

        signer = _signer;
        gDollar = IERC20(_gDollar);
        nextTokenId = 1;
    }

    // ============================================================
    // Badge minting (signer-only)
    // ============================================================

    /**
     * @notice Mint a badge to `to` for the module identified by `slug`.
     * @dev Idempotent: reverts if `to` already owns the badge for this slug.
     */
    function mint(
        address to,
        string calldata slug
    ) external onlySigner whenNotPaused {
        if (to == address(0)) revert ZeroAddress();

        bytes32 slugHash = keccak256(bytes(slug));

        if (earnedTokenId[to][slugHash] != 0) revert AlreadyEarned();
        if (bytes(moduleTokenURI[slugHash]).length == 0)
            revert URINotConfigured();

        uint256 tokenId = nextTokenId++;
        earnedTokenId[to][slugHash] = tokenId;
        tokenIdToSlugHash[tokenId] = slugHash;

        _safeMint(to, tokenId);
        emit BadgeMinted(to, tokenId, slugHash);
    }

    // ============================================================
    // Reward distribution (signer-only)
    // ============================================================

    /**
     * @notice Transfer `amount` of G$ to `to`, marking `claimId` as paid.
     * @dev Idempotent: reverts if claimId already used. Off-chain code generates
     *      claimId as keccak256(user + ":" + scope). Same claimId twice = no double-pay.
     */
    function distribute(
        address to,
        uint256 amount,
        bytes32 claimId
    ) external onlySigner whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (claimed[claimId]) revert AlreadyClaimed();

        claimed[claimId] = true;
        totalDistributed += amount;

        bool ok = gDollar.transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit RewardDistributed(to, amount, claimId);
    }

    /**
     * @notice Mint a badge AND distribute a reward in one transaction.
     * @dev Convenience for the most common backend flow (module completion).
     */
    function mintAndDistribute(
        address to,
        string calldata slug,
        uint256 amount,
        bytes32 claimId
    ) external onlySigner whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        bytes32 slugHash = keccak256(bytes(slug));

        // Mint
        if (earnedTokenId[to][slugHash] != 0) revert AlreadyEarned();
        if (bytes(moduleTokenURI[slugHash]).length == 0)
            revert URINotConfigured();

        uint256 tokenId = nextTokenId++;
        earnedTokenId[to][slugHash] = tokenId;
        tokenIdToSlugHash[tokenId] = slugHash;

        _safeMint(to, tokenId);
        emit BadgeMinted(to, tokenId, slugHash);

        // Distribute
        if (claimed[claimId]) revert AlreadyClaimed();
        claimed[claimId] = true;
        totalDistributed += amount;

        bool ok = gDollar.transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit RewardDistributed(to, amount, claimId);
    }

    // ============================================================
    // Reserve management (any caller — designed for WhackStake forfeits)
    // ============================================================

    /**
     * @notice Accept G$ into the reward reserve from any source. Emits an event so
     *         forfeit volume is trackable for pitch metrics.
     * @param amount Amount of G$ being deposited
     * @param source Human-readable tag like "whack-stake-forfeit" or "manual-topup"
     * @dev Caller must have approved this contract for `amount` G$ before calling.
     */
    function replenishReserve(
        uint256 amount,
        string calldata source
    ) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        bool ok = gDollar.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        totalReplenished += amount;
        emit ReserveReplenished(msg.sender, amount, source);
    }

    // ============================================================
    // ERC-721 overrides — enforce soulbound
    // ============================================================

    /**
     * @notice Soulbound: only mint (from == 0) and burn (to == 0) allowed.
     *         Reverts on any transfer attempt.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0))
            revert SoulboundCannotTransfer();
        return super._update(to, tokenId, auth);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        bytes32 slugHash = tokenIdToSlugHash[tokenId];
        return moduleTokenURI[slugHash];
    }

    // ============================================================
    // Admin (owner-only) — for the admin interface
    // ============================================================

    /// @notice Configure the metadata URI for a module slug. Required before badges of that slug can mint.
    function setModuleURI(
        string calldata slug,
        string calldata uri
    ) external onlyOwner {
        bytes32 slugHash = keccak256(bytes(slug));
        moduleTokenURI[slugHash] = uri;
        emit ModuleURISet(slugHash, uri);
    }

    /// @notice Rotate the backend signer wallet (e.g. if the key is compromised).
    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerChanged(signer, newSigner);
        signer = newSigner;
    }

    /// @notice Emergency stop. While paused, mint/distribute/replenish revert.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraw G$ from the contract — for redistribution to a new contract during migration.
    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        bool ok = gDollar.transfer(to, amount);
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    // ============================================================
    // Upgrade authority — UUPS pattern
    // ============================================================

    function _authorizeUpgrade(address) internal view override onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
    }

    /**
     * @notice Permanently disable future upgrades. Once called, this contract becomes immutable.
     * @dev Irreversible. Use only after the contract is proven stable in production.
     */
    function renounceUpgradeability() external onlyOwner {
        if (upgradeRenounced) revert UpgradeAlreadyRenounced();
        upgradeRenounced = true;
        emit UpgradeRenounced();
    }

    // ============================================================
    // View helpers
    // ============================================================

    /// @notice Reserve balance available for distributions.
    function reserveBalance() external view returns (uint256) {
        return gDollar.balanceOf(address(this));
    }
}
