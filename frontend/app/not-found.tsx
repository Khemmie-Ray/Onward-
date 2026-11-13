"use client";

import { HOME_ROUTE } from "@/lib/nav/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { useConnection } from "wagmi";

export default function NotFound() {
  const { isConnected, isConnecting, isReconnecting } = useConnection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isHydrating = isConnecting || isReconnecting;

  const showAuthedCTA = mounted && !isHydrating && isConnected;
  const destination = showAuthedCTA ? HOME_ROUTE : "/";
  const destinationLabel = showAuthedCTA ? "Back to dashboard" : "Back to home";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-[14%] h-[360px] w-[360px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.28)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12%] left-[12%] h-[300px] w-[300px] rounded-full opacity-40 blur-[80px] bg-[radial-gradient(circle,rgba(230,180,72,0.40)_0%,transparent_70%)]"
      />

      <div className="relative w-full max-w-[520px] animate-[fade-up_0.8s_ease_both]">
        <div className="rounded-[28px] border border-indigo/5 bg-paper px-7 py-11 text-center shadow-[0_24px_70px_rgba(31,58,110,0.12)] sm:px-12">
          <div className="mb-6 inline-flex h-[84px] w-[84px] items-center justify-center rounded-full bg-forest-tint">
            <Compass size={38} strokeWidth={1.8} className="text-forest" />
          </div>

          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-forest">
            Lost the loop
          </div>

          <h1 className="display mb-3 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-indigo sm:text-[42px]">
            This path doesn&apos;t exist yet.
          </h1>

          <p className="mx-auto mb-8 max-w-[360px] text-[14.5px] leading-[1.6] text-fg-soft">
            Maybe a typo, maybe a stale link. Either way, let&apos;s get you
            back on track.
          </p>

          <Link
            href={destination}
            className="group inline-flex items-center gap-2 rounded-full bg-indigo px-7 py-3.5 text-[14px] font-bold text-cream shadow-[0_6px_20px_rgba(31,58,110,0.28)] transition-all hover:-translate-y-0.5 hover:bg-indigo/90"
          >
            {destinationLabel}
            <ArrowRight
              size={15}
              strokeWidth={2.8}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
