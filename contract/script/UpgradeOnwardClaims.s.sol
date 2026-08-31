// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OnwardClaims} from "../src/OnwardClaims.sol";

interface IUUPS {
    function upgradeToAndCall(address newImplementation, bytes calldata data)
        external
        payable;
}

contract UpgradeOnwardClaims is Script {
    function run() external {
        address proxy = vm.envAddress("ONWARD_CLAIMS_PROXY");

        vm.startBroadcast();

        // 1. Deploy the new implementation.
        OnwardClaims newImpl = new OnwardClaims();
        console.log("New implementation deployed at:", address(newImpl));

        // 2. Point the proxy at it. Empty data = no initializer call.
        IUUPS(proxy).upgradeToAndCall(address(newImpl), "");
        console.log("Proxy upgraded:", proxy);

        vm.stopBroadcast();

        console.log("Upgrade complete. Verify totalContestPaidG() reads 0 and");
        console.log("existing reads (totalClaimedG, reserveBalance) are intact.");
    }
}