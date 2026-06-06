import { BookOpen } from "lucide-react";

export function ModulesPageHeader({
  totalComplete,
  totalModules,
}: {
  totalComplete: number;
  totalModules: number;
}) {
  return (
    <section className="mb-10 animate-[fade-up_0.8s_0.05s_ease_both]">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-aubergine mb-2">
        <BookOpen size={13} strokeWidth={2.5} />
        Modules
      </div>
      <h1 className="display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-tight text-indigo">
        Learn the ecosystem from the{" "}
        <span className="text-aubergine">inside out</span>.
      </h1>
      <p className="mt-2 text-[15px] text-fg-soft max-w-150">
        Five-minute lessons. Pass the quick check, mint a soulbound badge.
        You've completed {totalComplete} of {totalModules}.
      </p>
    </section>
  );
}