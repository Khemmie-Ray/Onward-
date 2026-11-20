"use client";

import { useMemo } from "react";
import { useConnection } from "wagmi";

const ADMIN_ADDRESSES = [
  "0xe25327d529a722bb05ca7cc495528e2cb2da520f",
  "0x617b8e03d30b26910e2fc783333708061017a379",
].map((a) => a.toLowerCase());

export function useIsAdmin(): {
  isAdmin: boolean;
  address: string | undefined;
  ready: boolean;
} {
  const { address, status } = useConnection();

  return useMemo(() => {
    const ready = status === "connected" || status === "disconnected";
   
    const bare = address?.split(":").pop()?.toLowerCase();
    const isAdmin = !!bare && ADMIN_ADDRESSES.includes(bare);
    return { isAdmin, address, ready };
  }, [address, status]);
}
