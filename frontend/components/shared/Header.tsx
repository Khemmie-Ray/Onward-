"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import { Squash as Hamburger } from "hamburger-react";
import { ArrowRight } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { WalletPill } from "../auth/WalletPill";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type ProfileStatus = {
  hasUsername: boolean;
  avatarId: string | null;
};

const INITIAL_HEADER_HEIGHT = 96;

const Header = () => {
  const { open } = useAppKit();
  const { isConnected, address, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const pathname = usePathname();
  const authFetch = useAuthFetch();

  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(INITIAL_HEADER_HEIGHT);

  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => setHeaderHeight(el.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isHydrating = status === "connecting" || status === "reconnecting";
  const showControl = mounted && !isHydrating;
  const isLeaderboardActive = pathname === "/leaderboard";

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
    setIsMobileMenuOpen(false);
    await disconnect();
    router.push("/");
  };

  const handleConnectClick = () => {
    setIsMobileMenuOpen(false);
    open();
  };

  const navPillBase =
    "px-5 py-2.5 rounded-xl font-semibold text-[14px] border border-fg-soft/25 transition";
  const navPillActive = "bg-mustard/30";
  const navPillInactive = "hover:bg-canvas-warm";

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-30 bg-paper/85 backdrop-blur-md border-b border-fg-soft/10 py-6"
      >
        <div className="mx-auto w-[90%]">
          <nav
            className="grid grid-cols-2 md:grid-cols-3 items-center gap-4"
            style={{ animation: "fade-up 0.8s 0.05s ease both" }}
          >
            <div className="justify-self-start">
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
            </div>

            <div className="hidden md:flex justify-self-center">
              {!isConnected && <Link
                href="/leaderboard"
                className={`${navPillBase} text-indigo ${
                  isLeaderboardActive ? navPillActive : navPillInactive
                }`}
              >
                Leaderboard
              </Link>}
            </div>

            <div className="justify-self-end">
              <div className="hidden md:flex items-center">
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
                      className="rounded-xl px-5 py-2.5 font-semibold text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0 bg-terracotta shadow-lg"
                    >
                      Connect wallet
                    </button>
                  ))}
              </div>

              <div className="md:hidden -mr-2">
                <Hamburger
                  toggled={isMobileMenuOpen}
                  toggle={setIsMobileMenuOpen}
                  size={22}
                  color="var(--color-indigo)"
                  rounded
                  label="Toggle menu"
                  duration={0.4}
                />
              </div>
            </div>
          </nav>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full inset-x-0 z-40 px-5 sm:px-8 pt-2">
            <div
              className="bg-paper rounded-2xl shadow-[0_12px_32px_rgba(31,58,110,0.12)] border border-fg-soft/10 p-4 flex flex-col gap-3"
              style={{ animation: "fade-up 0.3s ease both" }}
            >
              {!isConnected && <Link
                href="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between py-3 px-4 rounded-xl font-semibold border border-fg-soft/25 transition ${
                  isLeaderboardActive
                    ? "bg-mustard/30 text-indigo"
                    : "text-indigo hover:bg-canvas-warm"
                }`}
              >
                Leaderboard
                {!isLeaderboardActive && (
                  <ArrowRight
                    size={14}
                    strokeWidth={2.5}
                    className="text-mustard"
                  />
                )}
              </Link>}

              {showControl && (
                <div className="pt-3 border-t border-fg-soft/10">
                  {isConnected && address ? (
                    <WalletPill
                      address={address}
                      avatarId={data?.avatarId ?? null}
                      onDisconnect={handleDisconnect}
                    />
                  ) : (
                    <button
                      onClick={handleConnectClick}
                      className="w-full rounded-xl px-6 py-3.5 font-semibold text-paper bg-terracotta shadow-lg hover:bg-terracotta/90 transition"
                    >
                      Connect wallet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: headerHeight }}
      />

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-aubergine/30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
};

export default Header;