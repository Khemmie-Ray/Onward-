"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { AlertCircle, LogOut } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { HOME_ROUTE } from "@/lib/nav/routes";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useOnwardLogout } from "@/hooks/useOnwardLogout";
import { useIdentityContext } from "@/contexts/IdentityContext";
import {
  NAV_DESTINATIONS,
  isActiveDestination,
  type NavDestination,
} from "@/lib/nav/destinations";
import { useProfile } from "@/hooks/useProfile";

const ACTIVE = "bg-[#5EC484] text-blue";

export function Sidebar({
  destinations = NAV_DESTINATIONS,
}: {
  destinations?: NavDestination[];
}) {
  const pathname = usePathname();
  const { address } = useConnection();
  const authFetch = useAuthFetch();
  const logout = useOnwardLogout();
  const { isVerified } = useIdentityContext();
  const { profile: data, error } = useProfile();

  console.log(data);

  // Reuses the same cached query key as Header/ShellTopBar, so no extra request.
  const { data: profile } = useQuery({
    queryKey: ["me", "status", address ?? "anon"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/status");
      if (!res.ok) throw new Error("status failed");
      return res.json() as Promise<{
        avatarId: string | null;
        displayName: string | null;
      }>;
    },
    enabled: Boolean(address),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Profile is shown as a row below the nav, so keep it out of the main list.
  const mainNav = destinations.filter((d) => d.href !== "/profile");
  const username = data?.displayName?.trim() || "Profile";
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";
  const profileActive = isActiveDestination(pathname, "/profile");

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-blue px-4 py-6">
      <Link href={HOME_ROUTE} className="mb-10 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper/10">
          <LoopSigil size={20} color="var(--color-mustard)" />
        </div>
        <span className="display text-[22px] font-semibold text-paper">
          onward
        </span>
      </Link>

      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1.5">
          {mainNav.map((dest) => {
            const active = isActiveDestination(pathname, dest.href);
            const Icon = dest.icon;

            return (
              <li key={dest.href}>
                <Link
                  href={dest.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-all ${
                    active
                      ? `${ACTIVE} shadow-sm`
                      : "text-paper/75 hover:bg-paper/10 hover:text-paper"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.5 : 2.2}
                    className="shrink-0"
                  />
                  <span className="flex-1">{dest.label}</span>
                  {dest.badge?.text && (
                    <span className="rounded-full bg-paper/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                      {dest.badge.text}
                    </span>
                  )}
                  {dest.badge?.pulse && (
                    <span
                      className="h-2 w-2 rounded-full bg-mustard animate-pulse"
                      aria-label="New activity"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      
      <div className="mt-auto pt-4">
        <Link
        href="/profile"
        aria-current={profileActive ? "page" : undefined}
        className="relative mt-9 block rounded-[20px] bg-mint backdrop-blur-3xl px-4 pb-4 pt-9 text-center transition hover:brightness-[0.97]"
      >
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <span className="inline-block rounded-full ring-4 ring-blue">
            <UserAvatar avatarId={profile?.avatarId} size={54} />
          </span>
          {!isVerified && (
            <span
              title="Not verified yet"
              className="absolute right-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-mustard ring-2 ring-blue"
            >
              <AlertCircle
                size={11}
                strokeWidth={2.8}
                className="text-indigo"
              />
            </span>
          )}
        </span>

        <p className="truncate text-[15px] font-bold text-blue">{username}</p>
        {shortAddress && (
          <p className="mt-0.5 truncate font-mono text-[11px] ">
            {shortAddress}
          </p>
        )}
      </Link>
      <div className="border-t border-paper/20 my-3"></div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-paper/10 hover:text-paper"
        >
          <LogOut size={17} strokeWidth={2.2} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
