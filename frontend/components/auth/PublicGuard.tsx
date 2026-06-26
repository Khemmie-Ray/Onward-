"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status: sessionStatus, data: session } = useSession();
  const hasRedirectedRef = useRef(false);

  const isAuthenticated =
    sessionStatus === "authenticated" && !!session?.address;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.replace("/overview");
  }, [isAuthenticated, router]);

  return <>{children}</>;
}