"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, address, status } = useAppKitAccount();
  const authFetch = useAuthFetch();

  const isHydrating = status === "connecting" || status === "reconnecting";

  const { data, isLoading } = useQuery({
    queryKey: ["me", "status", address],
    queryFn: async () => {
      const res = await authFetch("/api/profile/status");
      if (!res.ok) throw new Error("Status check failed");
      return res.json() as Promise<{ hasUsername: boolean }>;
    },
    enabled: isConnected && !isHydrating && !!address,
    staleTime: 60_000,
  });

  const isOnboardingPath = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (isHydrating) return;

    if (!isConnected) {
      console.log("[AuthGuard] redirecting to / (not connected)");
      router.replace("/");
      return;
    }

    if (isLoading || !data) return;

    if (!data.hasUsername && !isOnboardingPath) {
      console.log("[AuthGuard] redirecting to /onboarding/username");
      router.replace("/onboarding/username");
      return;
    }

    if (data.hasUsername && isOnboardingPath) {
      console.log("[AuthGuard] redirecting to /overview (was on onboarding)");
      router.replace("/overview");
      return;
    }

    console.log("[AuthGuard] no redirect — staying on", pathname);
  }, [
    isHydrating,
    isConnected,
    isLoading,
    data,
    isOnboardingPath,
    router,
    pathname,
  ]);

  if (isHydrating) return <AuthLoadingScreen message="Connecting wallet…" />;
  if (!isConnected) return null; // brief flash before redirect
  if (isLoading && !data)
    return <AuthLoadingScreen message="Loading your profile…" />;

  if (data && !data.hasUsername && !isOnboardingPath) return null;
  if (data && data.hasUsername && isOnboardingPath) return null;

  return <>{children}</>;
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-fg-soft text-sm">{message}</div>
    </div>
  );
}
