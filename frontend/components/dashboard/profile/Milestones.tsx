import Link from "next/link";
import { MilestoneCard } from "./MilestoneCard";
import type { ResolvedMilestone } from "@/lib/milestones";

export function Milestones({ items }: { items: ResolvedMilestone[] }) {
  return (
    <section className="mb-10 animate-[fade-up_0.8s_0.24s_ease_both]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="display text-[22px] font-bold tracking-[-0.015em] text-indigo">
          Milestones
        </h2>
        <Link
          href="/profile/milestones"
          className="text-[12px] font-bold uppercase tracking-widest text-forest transition hover:text-indigo"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((m) => (
          <MilestoneCard key={m.track.id} m={m} />
        ))}
      </div>
    </section>
  );
}
