"use client";

import { useCallback } from "react";
import { SiweMessage } from "siwe";
import { useConfig } from "wagmi";
import { getConnection, signMessage } from "wagmi/actions";
import { getCsrfToken, signIn, signOut } from "next-auth/react";
import { celo } from "wagmi/chains";

let signMessageCallCount = 0;

export function useSiweAuth() {
  const config = useConfig();

  const signInWithEthereum = useCallback(async (): Promise<boolean> => {
    const account = getConnection(config);
    const address = account.address;
    if (!address) throw new Error("No wallet address available");

    console.log("[useSiweAuth] getting nonce...");
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

    signMessageCallCount += 1;
    console.log(
      `%c[useSiweAuth] signMessage CALL #${signMessageCallCount} — THIS TRIGGERS A WALLET POPUP`,
      "color:#e33;font-weight:bold",
    );

    const signature = await signMessage(config, {
      message: preparedMessage,
    });

    console.log("[useSiweAuth] got signature, verifying with NextAuth...");
    const result = await signIn("credentials", {
      message: preparedMessage,
      signature,
      redirect: false,
    });

    console.log("[useSiweAuth] NextAuth result:", result?.ok);
    return Boolean(result?.ok);
  }, [config]);

  const signOutOfOnward = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return { signInWithEthereum, signOutOfOnward };
}
