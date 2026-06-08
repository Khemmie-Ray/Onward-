"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useIdentity } from "@/hooks/useIdentity";

type IdentityContextValue = ReturnType<typeof useIdentity>;

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity();
  // console.log("[identity context]", identity);

  return (
    <IdentityContext.Provider value={identity}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentityContext(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error(
      "useIdentityContext must be used inside <IdentityProvider>"
    );
  }
  return ctx;
}
