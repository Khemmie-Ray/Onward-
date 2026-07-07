"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status: sessionStatus, data: session } = useSession();

  const isAuthenticated =
    sessionStatus === "authenticated" && !!session?.address;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/overview");
    }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}