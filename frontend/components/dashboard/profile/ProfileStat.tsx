const TONE_BG = {
  forest: "bg-forest-tint",
  mustard: "bg-mustard/25",
  aubergine: "bg-aubergine-tint",
  neutral: "bg-canvas-warm",
} as const;

export function ProfileStat({
  value,
  unit,
  label,
  tone,
}: {
  value: string;
  unit?: string;
  label: string;
  tone: keyof typeof TONE_BG;
}) {
  return (
    <div
      className={`w-full md:w-[calc(25%-9px)] rounded-[18px] px-4 py-3.5 ${TONE_BG[tone]}`}
    >
      <div className="display text-[26px] font-bold leading-none tabular-nums text-indigo">
        {value}
        {unit && (
          <span className="ml-0.5 text-[14px] font-semibold text-indigo/50">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[12px] font-semibold text-indigo/60">
        {label}
      </div>
    </div>
  );
}
