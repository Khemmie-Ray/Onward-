"use client";

import { useCallback } from "react";
import { SiweMessage } from "siwe";
import { useConfig } from "wagmi";
import { getConnection, signMessage } from "wagmi/actions";
import { getCsrfToken, signIn, signOut } from "next-auth/react";
import { celo } from "wagmi/chains";

export function useSiweAuth() {
  const config = useConfig();

  const signInWithEthereum = useCallback(async (): Promise<boolean> => {
    const account = getConnection(config);
    const address = account.address;
    if (!address) throw new Error("No wallet address available");

    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Failed to get nonce");

    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to Onward",
      uri: window.location.origin,
      version: "1",
      chainId: celo.id,
      nonce,
    });

    const preparedMessage = message.prepareMessage();
  
    const signature = await signMessage(config, {
      message: preparedMessage,
    });

    const result = await signIn("credentials", {
      message: preparedMessage,
      signature,
      redirect: false,
    });

    return Boolean(result?.ok);
  }, [config]);

  const signOutOfOnward = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return { signInWithEthereum, signOutOfOnward };
}
