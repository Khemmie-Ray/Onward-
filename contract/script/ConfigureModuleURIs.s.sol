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
        string memory cid_json = vm.envString("METADATA_CID_JSON");
        IBadgesAdmin badges = IBadgesAdmin(badgesAddr);

        vm.startBroadcast();

        // ─── 8 module badges ──────────────────────────────────
        // badges.setModuleURI("what-is-gooddollar",         _uri(cid, "1.json"));
        // badges.setModuleURI("daily-ubi-claim",            _uri(cid, "2.json"));
        // badges.setModuleURI("face-verification",          _uri(cid, "3.json"));
        // badges.setModuleURI("good-id-offers",             _uri(cid, "4.json"));
        // badges.setModuleURI("reserve-mechanics",          _uri(cid, "5.json"));
        // badges.setModuleURI("gas-sponsorship",            _uri(cid, "6.json"));
        // badges.setModuleURI("wallet-keys",                _uri(cid, "7.json"));
        // badges.setModuleURI("spotting-scams-in-the-wild", _uri(cid, "8.json"));

        // ─── 3 level milestone badges ─────────────────────────
        // badges.setModuleURI("level-25",  _uri(cid_json, "level-25.json"));
        // badges.setModuleURI("level-50",  _uri(cid_json, "level-50.json"));
        // badges.setModuleURI("level-100", _uri(cid_json, "level-100.json"));

        // -----3 New modules badges added
        badges.setModuleURI("what-is-a-token",  _uri(cid, "what-is-a-token.json"));
        badges.setModuleURI("who-built-gooddollar", _uri(cid, "who-built-good-dollar.json"));
        badges.setModuleURI("why-celo-fuse-xdc", _uri(cid, "why-celo-fuse-and-xdc.json"));

        vm.stopBroadcast();

        // console.log("Configured 11 module URIs on", badgesAddr);
        console.log("Configured 3 module URIs on", badgesAddr);

    }

    function _uri(string memory cid, string memory file) internal pure returns (string memory) {
        return string.concat("ipfs://", cid, "/", file);
    }
}
