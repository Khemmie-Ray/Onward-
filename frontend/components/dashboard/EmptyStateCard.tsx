import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";

const  EmptyStateCard = () => {
  return (
    <Link
      href="/modules"
      className="group relative block overflow-hidden rounded-[24px] bg-mustard-tint p-7 transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(31,58,110,0.08)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
      >
        <MudclothPattern />
      </div>
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-mustard px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo mb-3">
            <Sparkles size={11} strokeWidth={2.5} />
            Start your loop
          </div>
          <h2 className="display text-[28px] md:text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-indigo mb-2">
            Your first module is waiting.
          </h2>
          <p className="text-[13.5px] leading-[1.6] text-fg-soft">
            Pick up the foundations of GoodDollar in five minutes. Earn g$ when
            you finish.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-indigo px-5 py-3 text-[13px] font-bold text-paper shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-transform group-hover:translate-x-1">
          Browse modules <ArrowRight size={14} strokeWidth={2.8} />
        </div>
      </div>
    </Link>
  );
}


export default EmptyStateCard;