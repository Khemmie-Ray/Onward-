"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import { LoopSigil } from "@/components/home/motifs";
import { WalletPill } from "../auth/WalletPill";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type ProfileStatus = {
  hasUsername: boolean;
  avatarId: string | null;
};

const Header = () => {
  const { open } = useAppKit();
  const { isConnected, address, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isHydrating =
    status === "connecting" || status === "reconnecting";
  const showControl = mounted && !isHydrating;

  // Reuse the same query key as AuthGuard so TanStack Query dedupes the
  // request — only one HTTP call to /api/profile/status no matter how many
  // components ask for it.
  const { data } = useQuery({
    queryKey: ["me", "status", address ?? "anon"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/status");
      if (!res.ok) throw new Error("Status check failed");
      return res.json() as Promise<ProfileStatus>;
    },
    enabled: mounted && isConnected && !isHydrating && !!address,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const handleDisconnect = async () => {
    await disconnect();
    router.push("/");
  };

  return (
    <header className="py-8 mb-2 relative z-10">
      <nav
        className="flex items-center justify-between"
        style={{ animation: "fade-up 0.8s 0.05s ease both" }}
      >
        <Link
          href={isConnected ? "/overview" : "/"}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-indigo">
            <LoopSigil size={20} color="var(--color-mustard)" />
          </div>
          <span className="display text-[24px] font-semibold text-indigo">
            onward
          </span>
        </Link>

        {showControl &&
          (isConnected && address ? (
            <WalletPill
              address={address}
              avatarId={data?.avatarId ?? null}
              onDisconnect={handleDisconnect}
            />
          ) : (
            <button
              onClick={() => open()}
              className="rounded-xl px-6 py-3 font-semibold text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0 bg-terracotta shadow-lg"
            >
              Connect wallet
            </button>
          ))}
      </nav>
    </header>
  );
};

export default Header;