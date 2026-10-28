
export function PlayHero() {
  return (
    <div className="overflow-hidden rounded-[22px] bg-[#1C133D]">
      <div className="flex flex-col items-center gap-6 p-6 sm:p-8 md:flex-row md:gap-4">
        <div className="w-full min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-paper/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-paper/80">
            Game room
          </span>
          <h2 className="display mt-4 text-[32px] font-bold leading-[1.05] text-paper sm:text-[40px]">
            Play, learn,
            <br />
            <span className="text-mustard">have fun.</span>
          </h2>
          <p className="mt-4 max-w-[380px] text-[13.5px] leading-snug text-paper/70">
            Quick games that turn money skills into reflexes. Pick one, jump in,
            and learn something while you play.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Pill>Short rounds</Pill>
            <Pill>New games over time</Pill>
          </div>
        </div>

        <div className="w-full max-w-[440px] shrink-0 md:w-[46%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/play-hero.svg"
            alt="Onward arcade"
            width={640}
            height={360}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-paper/10 px-3.5 py-1.5 text-[12px] font-semibold text-paper">
      {children}
    </span>
  );
}
