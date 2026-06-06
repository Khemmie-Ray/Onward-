"use client";

import { useCallback } from "react";
import { useAppKitAccount } from "@reown/appkit/react";

export function useAuthFetch() {
  const { address } = useAppKitAccount();

  return useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (address) headers.set("x-wallet-address", address);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(input, { ...init, headers });
    },
    [address]
  );
}