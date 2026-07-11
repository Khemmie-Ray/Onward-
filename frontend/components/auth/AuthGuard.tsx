"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useConnection } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isConnecting, isReconnecting } = useConnection();
  const { data: session, status: sessionStatus } = useSession();
  const authFetch = useAuthFetch();
  const lastRedirectRef = useRef<string | null>(null);
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHydrationTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSessionLoading = sessionStatus === "loading";
  const isAuthenticated =
    sessionStatus === "authenticated" && !!session?.address;

  // Wallet hydration only blocks when there's no session yet. With a valid
  // session, pages render fine; the wallet reconnects in the background and
  // is only needed when the user signs a transaction.
  const isWalletHydrating =
    !isAuthenticated && !hydrationTimedOut && (isConnecting || isReconnecting);

  const { data, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me", "status", session?.address ?? "anon"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/status");
      if (!res.ok) throw new Error("Status check failed");
      return res.json() as Promise<{
        hasUsername: boolean;
        hasName: boolean;
        hasAvatar: boolean;
        avatarId: string | null;
      }>;
    },
    enabled: isMounted && isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const isOnboardingPath = pathname.startsWith("/onboarding");
  const isLandingPath = pathname === "/";

  // ─── Compute desired destination (pure derivation) ──────
  let desiredTarget: string | null = null;

  if (isMounted && !isWalletHydrating && !isSessionLoading) {
    if (!isAuthenticated) {
      desiredTarget = isLandingPath ? null : "/";
    } else if (data) {
      if (!data.hasUsername) {
        desiredTarget = isOnboardingPath ? null : "/onboarding/username";
      } else if (isOnboardingPath || isLandingPath) {
        desiredTarget = "/overview";
      }
    }
  }

  // ─── Fire redirect side effect ──────────────────────────
  useEffect(() => {
    if (!desiredTarget) return;
    if (lastRedirectRef.current === desiredTarget) return;
    lastRedirectRef.current = desiredTarget;
    router.replace(desiredTarget);
  }, [desiredTarget, router]);

  // Reset dedupe ref when path actually changes
  useEffect(() => {
    lastRedirectRef.current = null;
  }, [pathname]);

  // ─── Render decisions ───────────────────────────────────

  if (!isMounted) {
    return <AuthLoadingScreen message="Loading…" />;
  }

  if (isWalletHydrating) {
    return <AuthLoadingScreen message="Connecting…" />;
  }

  if (isSessionLoading) {
    return <AuthLoadingScreen message="Verifying session…" />;
  }

  if (!isAuthenticated) {
    if (!isLandingPath) {
      return <AuthLoadingScreen message="Redirecting…" />;
    }
    return <>{children}</>;
  }

  if (isProfileLoading || !data) {
    return <AuthLoadingScreen message="Loading your profile…" />;
  }

  if (desiredTarget !== null) {
    return <AuthLoadingScreen message="Redirecting…" />;
  }

  return <>{children}</>;
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-canvas">
      <div className="h-10 w-10 rounded-full border-2 border-canvas-warm border-t-indigo animate-spin" />
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
        {message}
      </div>
    </div>
  );
}
