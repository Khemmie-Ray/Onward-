"use client"

import Link from "next/link";
import { ArrowRight, BookOpen, Check, Sparkles, Target } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import { FeatureCard } from "@/components/home/FeatureCard";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export default function Home() {
  const router = useRouter();
  const { isConnected, status } = useAppKitAccount();
  const isHydrating = status === "connecting" || status === "reconnecting";

  useEffect(() => {
    if (!isHydrating && isConnected) {
      router.replace("/overview");
    }
  }, [isHydrating, isConnected, router]);

  return (
    <main className="mx-auto lg:w-[80%] md:w-[80%] w-[90%] relative">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[8%] h-[500px] w-[500px] rounded-full opacity-60 blur-[80px] bg-[radial-gradient(circle,rgba(230,180,72,0.45)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-8%] bottom-[5%] h-[600px] w-[600px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.35)_0%,transparent_70%)]"
      />

      <div className="relative w-full">
        <Header />
        <div className="flex justify-between lg:flex-row md:flex-row flex-col items-center">
          <div className="stagger lg:w-[40%] md:w-[40%] w-full mb-4">
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
              A loop, not a course. Bite-sized lessons and daily challenges that
              pay you in g$ as you learn the GoodDollar ecosystem from the inside out.
            </p>

            <div className="mt-7 flex items-center gap-5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-terracotta px-6 py-3.5 font-semibold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Start learning
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="display text-[24px] font-bold leading-none text-indigo">
                  0
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
                  Learners
                </span>
              </div>
              <div className="h-8 w-px bg-shadow" />
              <div className="flex flex-col">
                <span className="display text-[24px] font-bold leading-none text-terracotta">
                  0
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
                  g$ distributed
                </span>
              </div>
              <div className="h-8 w-px bg-shadow" />
              <div className="flex flex-col">
                <span className="display text-[24px] font-bold leading-none text-forest">
                 0
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
                  Modules done
                </span>
              </div>
            </div>
          </div>
          <div className="relative flex lg:w-[55%] md:w-[55%] w-full items-center justify-center animate-[fade-up_0.9s_0.4s_ease_both] mb-4">
         <Image 
         src="/hero.png"
         alt=""
         width={300}
         height={300}
         className="w-full"
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
  );
}