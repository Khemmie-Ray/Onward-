// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockGDollar
 * @notice Testnet stand-in for the real GoodDollar G$ token.
*/

contract MockGDollar is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 10_000 ether;

    /// @notice Tracks last faucet claim time per address (24h cooldown).
    mapping(address => uint256) public lastFaucetClaim;

    error FaucetCooldownActive(uint256 secondsRemaining);

    constructor(address _owner) ERC20("Mock GoodDollar", "G$") Ownable(_owner) {
        _mint(_owner, 100_000_000 ether);
    }

    /**
     * @notice Self-service faucet. Anyone can claim 10,000 G$ once per 24 hours.
     * @dev Useful for testnet demos — judges/collaborators can fund themselves.
     */
    function faucet() external {
        uint256 last = lastFaucetClaim[msg.sender];
        if (last != 0 && block.timestamp < last + 24 hours) {
            revert FaucetCooldownActive(last + 24 hours - block.timestamp);
        }
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner can mint freely — useful for funding OnwardBadges reserve
     *         and WhackStake bonus pool during testnet setup.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}