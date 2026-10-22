"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { WalletPill } from "@/components/auth/WalletPill";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useOnwardLogout } from "@/hooks/useOnwardLogout";

export function ShellTopBar() {
  const { address, isConnected, isConnecting, isReconnecting } =
    useConnection();
  const authFetch = useAuthFetch();
  const logout = useOnwardLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isHydrating = isConnecting || isReconnecting;

  const { data } = useQuery({
    queryKey: ["me", "status", address ?? "anon"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/status");
      if (!res.ok) throw new Error("Status check failed");
      return res.json() as Promise<{ avatarId: string | null }>;
    },
    enabled: mounted && isConnected && !isHydrating && !!address,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!mounted || isHydrating || !isConnected || !address) return null;

  return (
    <div className="flex justify-end">
      <WalletPill
        address={address}
        avatarId={data?.avatarId ?? null}
        onDisconnect={() => void logout()}
      />
    </div>
  );
}
