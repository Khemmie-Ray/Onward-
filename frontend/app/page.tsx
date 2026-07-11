"use client";

import { ArrowRight, BookOpen, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FeatureCard } from "@/components/home/FeatureCard";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { PublicGuard } from "@/components/auth/PublicGuard";
import { LoginModal } from "@/components/auth/LoginModal";

type Stats = {
  learners: number;
  gDistributed: number;
  modulesDone: number;
};

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false);

  const [stats, setStats] = useState<Stats>({
    learners: 0,
    gDistributed: 0,
    modulesDone: 0,
  });

  // Capture referral code from ?ref= param into localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("onward_ref", ref.toUpperCase());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = (await res.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch {
        // Silently fall back to zeros — landing page must still render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicGuard>
      <main className="mx-auto w-[90%] flex flex-col relative mt-10">
        <Header />
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute right-[10%] top-[8%] h-[200px] w-[200px] rounded-full opacity-60 blur-[80px] bg-[radial-gradient(circle,rgba(230,180,72,0.45)_0%,transparent_70%)]" />
          <div className="absolute left-[8%] bottom-[5%] h-[200px] w-[200px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.35)_0%,transparent_70%)]" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          <div className="flex justify-between lg:flex-row md:flex-row flex-col items-center">
            <div className="stagger lg:w-[40%] md:w-[40%] w-full mb-8">
              <h1 className="mt-5 font-semibold leading-[1.02] tracking-tight">
                <span className="block text-[48px] text-indigo md:text-[60px]">
                  Learn the loop.
                </span>
                <span className="block text-[48px] text-indigo md:text-[60px]">
                  Earn the g$.
                </span>
                <span className="block text-[48px] text-terracotta md:text-[60px]">
                  Beat the scams.
                </span>
              </h1>

              <p className="mt-5 text-[18px] leading-[1.65] text-fg-soft">
                A loop, not a course. Bite-sized lessons and daily challenges
                that pay you in g$ as you learn the GoodDollar ecosystem from
                the inside out.
              </p>

              <div className="mt-7 flex items-center gap-5">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center gap-2 bg-terracotta px-6 py-3.5 font-semibold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start learning
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <Stat
                  value={stats.learners.toLocaleString()}
                  label="Learners"
                  tone="indigo"
                />
                <div className="h-8 w-px bg-shadow" />
                <Stat
                  value={stats.gDistributed.toLocaleString()}
                  label="g$ distributed"
                  tone="terracotta"
                />
                <div className="h-8 w-px bg-shadow" />
                <Stat
                  value={stats.modulesDone.toLocaleString()}
                  label="Modules done"
                  tone="forest"
                />
              </div>
            </div>
            <div className="relative flex lg:w-[55%] md:w-[55%] w-full items-center justify-center animate-[fade-up_0.9s_0.4s_ease_both] mb-4">
              <Image
                src="/hero.png"
                alt=""
                width={300}
                height={300}
                className="w-full"
                priority
              />
            </div>
          </div>
          <div className="flex justify-between items-center lg:flex-row md:flex-row flex-col my-20">
            <FeatureCard
              icon={BookOpen}
              title="Modules"
              copy="Five-minute lessons. Pass the quick check, mint a soulbound badge to your wallet."
              bg="var(--color-mustard-tint)"
              iconBg="var(--color-mustard)"
              iconColor="var(--color-indigo)"
            />
            <FeatureCard
              icon={Target}
              title="Whack-a-scam"
              copy="Sixty seconds. One round a day. Train the muscle that spots fraud before it costs you."
              bg="var(--color-terracotta-tint)"
              iconBg="var(--color-terracotta)"
              iconColor="var(--color-paper)"
            />
            <FeatureCard
              icon={Sparkles}
              title="Achievements"
              copy="Soulbound badges that prove what you actually know. Yours, forever, on Celo."
              bg="var(--color-aubergine-tint)"
              iconBg="var(--color-aubergine)"
              iconColor="var(--color-paper)"
            />
          </div>
          <Footer />
        </div>
      </main>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </PublicGuard>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "indigo" | "terracotta" | "forest";
}) {
  const toneClass =
    tone === "indigo"
      ? "text-indigo"
      : tone === "terracotta"
        ? "text-terracotta"
        : "text-forest";
  return (
    <div className="flex flex-col">
      <span
        className={`display text-[24px] font-bold leading-none tabular-nums ${toneClass}`}
      >
        {value}
      </span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
        {label}
      </span>
    </div>
  );
}
