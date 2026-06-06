
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockGDollar} from "../src/MockGDollar.sol";

/**
 * Deploy the MockGDollar testnet token.
 *
 * Env required:
 *   OWNER_ADDRESS — wallet that will own the token (gets 100M initial mint)
 *   PRIVATE_KEY   — deployer key (read by vm.startBroadcast automatically)
 *
 * Run:
 *   source .env
 *   forge script script/DeployMockGDollar.s.sol:DeployMockGDollar \
 *     --rpc-url celo-sepolia \
 *     --broadcast \
 *     --legacy
 */
contract DeployMockGDollar is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        MockGDollar token = new MockGDollar(owner);

        vm.stopBroadcast();

        console.log("=== MockGDollar deployed ===");
        console.log("Address:", address(token));
        console.log("Owner:  ", owner);
        console.log("");
        console.log("Save this address as GDOLLAR_ADDRESS in your .env");
    }
}