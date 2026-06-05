// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

interface IBadgesAdmin {
    function setModuleURI(string calldata slug, string calldata uri) external;
}

contract ConfigureModuleURIs is Script {
    function run() external {
        address badgesAddr = vm.envAddress("ONWARD_BADGES_ADDRESS");
        string memory cid = vm.envString("METADATA_CID");
        IBadgesAdmin badges = IBadgesAdmin(badgesAddr);

        vm.startBroadcast();

        // ─── 8 module badges ──────────────────────────────────
        badges.setModuleURI("what-is-gooddollar",         _uri(cid, "bafkreig7kuluifvnavvo3y7d2de6yub2kvkrb5kluzf74h4k2dsx3kh6ke"));
        badges.setModuleURI("daily-ubi-claim",            _uri(cid, "daily-ubi-claim.json"));
        badges.setModuleURI("face-verification",          _uri(cid, "face-verification.json"));
        badges.setModuleURI("good-id-offers",             _uri(cid, "good-id-offers.json"));
        badges.setModuleURI("reserve-mechanics",          _uri(cid, "reserve-mechanics.json"));
        badges.setModuleURI("gas-sponsorship",            _uri(cid, "gas-sponsorship.json"));
        badges.setModuleURI("wallet-keys",                _uri(cid, "wallet-keys.json"));
        badges.setModuleURI("spotting-scams-in-the-wild", _uri(cid, "spotting-scams-in-the-wild.json"));

        // ─── 3 level milestone badges ─────────────────────────
        badges.setModuleURI("level-25",  _uri(cid, "level-25.json"));
        badges.setModuleURI("level-50",  _uri(cid, "level-50.json"));
        badges.setModuleURI("level-100", _uri(cid, "level-100.json"));

        vm.stopBroadcast();

        console.log("Configured 11 module URIs on", badgesAddr);
    }

    function _uri(string memory cid, string memory file) internal pure returns (string memory) {
        return string.concat("ipfs://", cid, "/", file);
    }
}
