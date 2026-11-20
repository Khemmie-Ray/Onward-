"use client";

import { LogOut } from "lucide-react";
import { useOnwardLogout } from "@/hooks/useOnwardLogout";

export function MobileSignOut() {
  const logout = useOnwardLogout();

  return (
    <button
      onClick={logout}
      className="flex md:hidden lg:hidden w-full items-center justify-center gap-2 rounded-2xl bg-paper px-4 py-3 text-[13px] font-bold text-terracotta shadow-[0_2px_10px_rgba(31,58,110,0.05)] transition hover:bg-terracotta/5"
    >
      <LogOut size={15} strokeWidth={2.5} />
      Sign out
    </button>
  );
}
