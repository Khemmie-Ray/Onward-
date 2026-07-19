// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OnwardClaims} from "../src/OnwardClaims.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployOnwardClaims is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address owner    = vm.envAddress("CLAIMS_OWNER");     
        address signer   = vm.envAddress("SIGNER_ADDRESS");    
        address gDollar  = vm.envAddress("GDOLLAR_ADDRESS");  
        address identity = vm.envAddress("IDENTITY_ADDRESS"); 

        vm.startBroadcast(pk);

        OnwardClaims impl = new OnwardClaims();
        console.log("Implementation:", address(impl));

        bytes memory init = abi.encodeCall(
            OnwardClaims.initialize, (owner, signer, gDollar, identity)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), init);
        console.log("Proxy:", address(proxy));

        vm.stopBroadcast();
    }
}