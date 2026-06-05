// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Upgrades, Options} from "openzeppelin-foundry-upgrades/Upgrades.sol";

contract Deploy is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        address signer = vm.envAddress("SIGNER_ADDRESS");
        address gDollar = vm.envAddress("GDOLLAR_ADDRESS");
        uint256 stakeAmount = vm.envUint("STAKE_AMOUNT_WEI");
        uint256 bonusAmount = vm.envUint("BONUS_AMOUNT_WEI");

        vm.startBroadcast();

        Options memory opts;
        opts.unsafeSkipAllChecks = true;

        // ─── Deploy OnwardBadges proxy ────────────────────────
        address badgesProxy = Upgrades.deployUUPSProxy(
            "OnwardBadges.sol:OnwardBadges",
            abi.encodeWithSignature(
                "initialize(address,address,address)",
                owner,
                signer,
                gDollar
            ),
            opts
        );
        console.log("OnwardBadges proxy:", badgesProxy);

        // ─── Deploy WhackStake proxy ──────────────────────────
        address stakeProxy = Upgrades.deployUUPSProxy(
            "WhackStake.sol:WhackStake",
            abi.encodeWithSignature(
                "initialize(address,address,address,address,uint256,uint256)",
                owner,
                signer,
                gDollar,
                badgesProxy,
                stakeAmount,
                bonusAmount
            ),
            opts
        );
        console.log("WhackStake proxy:  ", stakeProxy);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment summary ===");
        console.log("Owner (set as multisig):       ", owner);
        console.log("Backend signer:                ", signer);
        console.log("G$ token:                      ", gDollar);
        console.log("OnwardBadges proxy:            ", badgesProxy);
        console.log("WhackStake proxy:              ", stakeProxy);
        console.log("Stake amount (wei):            ", stakeAmount);
        console.log("Bonus amount (wei):            ", bonusAmount);
        console.log("");
        console.log("Next steps:");
        console.log("1. Set module URIs via setModuleURI() on OnwardBadges");
        console.log("2. Fund OnwardBadges with G$ for the reward reserve");
        console.log("3. Fund WhackStake bonus pool via fundBonusPool()");
        console.log("4. Update .env.local with the proxy addresses");
    }
}
