
export function ScamPatternCard({
  familyLabel,
  familyDescription,
}: {
  familyLabel: string;
  familyDescription: string;
}) {
  return (
    <div className="rounded-2xl bg-[#1C133D] p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5CC27C]">
        Today&apos;s pattern
      </div>
      <h3 className="display mt-2 text-[20px] font-bold leading-tight text-paper">
        {familyLabel}
      </h3>
      <p className="mt-2 text-[13px] leading-snug text-paper/70">
        {familyDescription}
      </p>
    </div>
  );
}
