
const TONES = [
  "bg-aubergine-tint text-aubergine",
  "bg-forest-tint text-forest",
  "bg-mustard/30 text-indigo",
  "bg-terracotta-tint text-terracotta",
  "bg-indigo text-cream",
] as const;

function toneFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function Avatar({
  name,
  size = 36,
  tone,
  className = "",
}: {
  name: string;
  size?: number;
  tone?: string;
  className?: string;
}) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
        tone ?? toneFor(name)
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </span>
  );
}