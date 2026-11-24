"use client";

import { HOME_ROUTE } from "@/lib/nav/routes";
import { useEffect } from "react";
import { useConnection } from "wagmi";
import { useSession } from "next-auth/react";
import { useSiweAuth } from "@/hooks/useSiweAuth";

const attemptedAddresses = new Set<string>();
let inFlight = false;

export function resetSiweGate() {
  attemptedAddresses.clear();
  inFlight = false;
}

export function SiweGate() {
  const { isConnected, address } = useConnection();
  const { data: session, status } = useSession();
  const { signInWithEthereum } = useSiweAuth();

  useEffect(() => {
    if (!isConnected || !address) return;
    if (status === "loading" || inFlight) return;

    const sessionAddress = session?.address?.toLowerCase();
    const connectedAddress = address.toLowerCase();
    const sessionMatchesWallet =
      status === "authenticated" && sessionAddress === connectedAddress;

    if (sessionMatchesWallet) {
      return;
    }

    if (attemptedAddresses.has(connectedAddress)) return;

    console.log("[SiweGate] FIRING SIWE for", connectedAddress, {
      status,
      sessionAddress,
      reason:
        status === "authenticated" ? "stale-session-mismatch" : "no-session",
    });

    attemptedAddresses.add(connectedAddress);
    inFlight = true;

    signInWithEthereum()
      .then((ok) => {
        console.log("[SiweGate] SIWE result:", ok);
        if (ok) {
          window.location.assign(HOME_ROUTE);
        } else {
          attemptedAddresses.delete(connectedAddress);
        }
      })
      .catch((e) => {
        console.error("[SiweGate] SIWE failed", e);
        attemptedAddresses.delete(connectedAddress);
      })
      .finally(() => {
        inFlight = false;
      });
  }, [isConnected, address, status, session, signInWithEthereum]);

  return null;
}
