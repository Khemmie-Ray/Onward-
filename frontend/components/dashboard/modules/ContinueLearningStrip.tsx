import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";
import type { ModulePreview } from "@/lib/modules/types";

export function ContinueLearningStrip({ module }: { module: ModulePreview }) {
  return (
    <section className="mb-12 animate-[fade-up_0.8s_0.18s_ease_both]">
      <Link
        href={`/modules/${module.slug}`}
        className="group relative block overflow-hidden rounded-[20px] bg-aubergine p-6 shadow-[0_12px_32px_rgba(91,46,92,0.25)] transition-transform hover:-translate-y-1"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
        >
          <MudclothPattern />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-mustard mb-2">
              <Sparkles size={11} strokeWidth={2.5} /> Continue
            </div>
            <h2 className="display text-[24px] font-semibold tracking-[-0.015em] text-paper mb-1">
              {module.title}
            </h2>
            <p className="text-[13px] text-paper/75 mb-3">{module.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-widest text-paper/70">
                Section 2 of 3
              </span>
              <span className="display text-[11px] font-bold tabular-nums text-mustard">
                {module.progress}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 max-w-[320px] overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-mustard transition-[width]"
                style={{ width: `${module.progress ?? 0}%` }}
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mustard px-5 py-2.5 text-[13px] font-bold text-indigo transition-transform group-hover:translate-x-1 self-start md:self-center">
            Resume <ArrowRight size={13} strokeWidth={2.8} />
          </div>
        </div>
      </Link>
    </section>
  );
}