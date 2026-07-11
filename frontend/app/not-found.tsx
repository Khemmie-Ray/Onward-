"use client";

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
  const destination = showAuthedCTA ? "/overview" : "/";
  const destinationLabel = showAuthedCTA ? "Back to dashboard" : "Back to home";

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[15%] top-[10%] h-[400px] w-[400px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.30)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] bottom-[10%] h-[300px] w-[300px] rounded-full opacity-40 blur-[80px] bg-[radial-gradient(circle,rgba(230,180,72,0.40)_0%,transparent_70%)]"
      />

      <div className="relative max-w-[480px] text-center animate-[fade-up_0.8s_ease_both]">
        <div className="relative inline-flex mb-8">
          <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-paper shadow-[0_8px_24px_rgba(31,58,110,0.08)]">
            <Compass size={40} strokeWidth={1.8} className="text-terracotta" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta mb-3">
          Lost the loop
        </div>

        <h1 className="display text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-[-0.025em] text-indigo mb-4">
          This path doesn&apos;t exist yet.
        </h1>

        <p className="text-[15px] leading-[1.6] text-fg-soft mb-8">
          Maybe a typo, maybe a stale link. Either way, let&apos;s get you back
          on track.
        </p>

        <Link
          href={destination}
          className="group inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-[14px] font-bold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-all hover:-translate-y-0.5"
        >
          {destinationLabel}
          <ArrowRight
            size={15}
            strokeWidth={2.8}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </main>
  );
}
