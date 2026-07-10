import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

if (!clientId) {
  throw new Error("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not defined");
}

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    defaultChainId: "0xa4ec",
    // sessionTime: 86400 * 7
  },
};

export default web3AuthContextConfig;
