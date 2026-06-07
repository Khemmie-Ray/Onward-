// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev UUPS-compatible reentrancy guard. Functionally equivalent to OZ's
 *      ReentrancyGuardUpgradeable. Uses a storage gap so it's safe to add
 *      to upgradeable contracts.
 */
abstract contract ReentrancyGuardLite {
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    error ReentrancyGuardReentrantCall();

    function __ReentrancyGuard_init() internal {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    uint256[49] private __gapReentrancy;
}