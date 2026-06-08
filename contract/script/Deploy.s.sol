// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {OnwardBadges} from "../src/OnwardBadges.sol";
import {WhackStake} from "../src/WhackStake.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.envAddress("OWNER_ADDRESS");
        address signer = vm.envAddress("SIGNER_ADDRESS");
        address gDollar = vm.envAddress("GDOLLAR_ADDRESS");
        uint256 stakeAmount = vm.envUint("STAKE_AMOUNT_WEI");
        uint256 bonusAmount = vm.envUint("BONUS_AMOUNT_WEI");

        vm.startBroadcast(deployerKey);

        // 1. OnwardBadges (UUPS proxy)
        OnwardBadges badgesImpl = new OnwardBadges();
        bytes memory badgesInit = abi.encodeWithSelector(
            OnwardBadges.initialize.selector,
            owner,
            signer,
            gDollar
        );
        ERC1967Proxy badgesProxy = new ERC1967Proxy(
            address(badgesImpl),
            badgesInit
        );

        // 2. WhackStake (UUPS proxy)
        WhackStake stakeImpl = new WhackStake();
        bytes memory stakeInit = abi.encodeWithSelector(
            WhackStake.initialize.selector,
            owner,
            signer,
            gDollar,
            address(badgesProxy),
            stakeAmount,
            bonusAmount
        );
        ERC1967Proxy stakeProxy = new ERC1967Proxy(
            address(stakeImpl),
            stakeInit
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("OnwardBadges implementation:", address(badgesImpl));
        console.log("OnwardBadges proxy:         ", address(badgesProxy));
        console.log("WhackStake implementation:  ", address(stakeImpl));
        console.log("WhackStake proxy:           ", address(stakeProxy));
        console.log("");
        console.log("Next steps:");
        console.log("1. Update NEXT_PUBLIC_CONTRACT_ADDRESS to badges proxy");
        console.log("2. Update NEXT_PUBLIC_WHACKSTAKE_ADDRESS to stake proxy");
        console.log("3. Fund OnwardBadges reserve via replenishReserve()");
        console.log("4. Fund WhackStake bonus pool via fundBonusPool()");
        console.log("5. Configure module URIs via setModuleURI() per slug");
    }
}
