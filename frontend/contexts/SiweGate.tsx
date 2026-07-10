"use client";

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

    // KEY FIX: check whether the SESSION address matches the CONNECTED wallet.
    // A stale session from a previous login can leave status="authenticated"
    // for a DIFFERENT address than the wallet now connected. In that case we
    // must run SIWE for the new wallet, not skip.
    const sessionAddress = session?.address?.toLowerCase();
    const connectedAddress = address.toLowerCase();
    const sessionMatchesWallet =
      status === "authenticated" && sessionAddress === connectedAddress;

    if (sessionMatchesWallet) {
      // Correctly authenticated for THIS wallet — nothing to do.
      return;
    }

    // Either unauthenticated, OR authenticated as a different (stale) address.
    if (attemptedAddresses.has(connectedAddress)) return;

    console.log("[SiweGate] FIRING SIWE for", connectedAddress, {
      status,
      sessionAddress,
      reason: status === "authenticated" ? "stale-session-mismatch" : "no-session",
    });

    attemptedAddresses.add(connectedAddress);
    inFlight = true;

    signInWithEthereum()
      .then((ok) => {
        console.log("[SiweGate] SIWE result:", ok);
        if (ok) {
          window.location.assign("/overview");
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