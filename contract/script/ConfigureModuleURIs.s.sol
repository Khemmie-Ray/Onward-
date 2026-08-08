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
        // badges.setModuleURI("what-is-a-token",  _uri(cid, "what-is-a-token.json"));
        // badges.setModuleURI("who-built-gooddollar", _uri(cid, "who-built-good-dollar.json"));
        // badges.setModuleURI("why-celo-fuse-xdc", _uri(cid, "why-celo-fuse-and-xdc.json"));

        // badges.setModuleURI("money-on-the-internet",        _uri(cid, "money-on-the-internet.json"));
        // badges.setModuleURI("why-anyone-made-this",         _uri(cid, "why-anyone-made-this.json"));
        // badges.setModuleURI("who-runs-it",                  _uri(cid, "who-runs-it.json"));
        // badges.setModuleURI("what-you-can-do",              _uri(cid, "what-you-can-do.json"));
        // badges.setModuleURI("what-a-wallet-is",             _uri(cid, "what-a-wallet-is.json"));
        // badges.setModuleURI("what-your-wallet-holds",       _uri(cid, "what-your-wallet-holds.json"));
        // badges.setModuleURI("wallets-people-use",           _uri(cid, "wallets-people-use.json"));
        // badges.setModuleURI("setting-up-your-wallet",       _uri(cid, "setting-up-your-wallet.json"));
        // badges.setModuleURI("your-address-is-your-identity",_uri(cid, "your-address-is-your-identity.json"));
        // badges.setModuleURI("your-address-is-public",       _uri(cid, "your-address-is-public.json"));
        // badges.setModuleURI("key-you-never-share",          _uri(cid, "key-you-never-share.json"));
        // badges.setModuleURI("words-that-restore-everything",_uri(cid, "words-that-restore-everything.json"));
        // badges.setModuleURI("hot-and-cold-wallets",         _uri(cid, "hot-and-cold-wallets.json"));


        // ─── Networks track (8 new module badges) ─────────────
        badges.setModuleURI("not-one-blockchain",       _uri(cid, "not-one-blockchain.json"));
        badges.setModuleURI("bitcoin-the-original",     _uri(cid, "bitcoin-the-original.json"));
        badges.setModuleURI("ethereum-and-apps",        _uri(cid, "ethereum-and-apps.json"));
        badges.setModuleURI("solana-and-other-worlds",  _uri(cid, "solana-and-other-worlds.json"));
        badges.setModuleURI("evm-shared-language",      _uri(cid, "evm-shared-language.json"));
        badges.setModuleURI("layers-base-and-top",      _uri(cid, "layers-base-and-top.json"));
        badges.setModuleURI("sidechains-and-bridges",   _uri(cid, "sidechains-and-bridges.json"));
        badges.setModuleURI("wrong-network",            _uri(cid, "wrong-network.json"));

        vm.stopBroadcast();

        // console.log("Configured 11 module URIs on", badgesAddr);
        console.log("Configured 8 module URIs on", badgesAddr);

    }

    function _uri(string memory cid, string memory file) internal pure returns (string memory) {
        return string.concat("ipfs://", cid, "/", file);
    }
}
