export function LoopSigil({
  size = 28,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
  
      <line
        x1="20"
        y1="2"
        x2="20"
        y2="8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="32"
        x2="20"
        y2="38"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="20"
        x2="8"
        y2="20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="20"
        x2="38"
        y2="20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="7.5"
        y1="7.5"
        x2="11.5"
        y2="11.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="28.5"
        y1="28.5"
        x2="32.5"
        y2="32.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="32.5"
        y1="7.5"
        x2="28.5"
        y2="11.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="11.5"
        y1="28.5"
        x2="7.5"
        y2="32.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
   
      <circle
        cx="20"
        cy="20"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* inner pupil */}
      <circle cx="20" cy="20" r="3.5" fill={color} />
    </svg>
  );
}

export function SunMotif({
  size = 32,
  className = "",
  rays = 8,
}: {
  size?: number;
  className?: string;
  rays?: number;
}) {
  const rayLines = Array.from({ length: rays }).map((_, i) => {
    const angle = (i * 360) / rays;
    const rad = (angle * Math.PI) / 180;
    const r1 = 12;
    const r2 = 17;
    const x1 = 20 + r1 * Math.cos(rad);
    const y1 = 20 + r1 * Math.sin(rad);
    const x2 = 20 + r2 * Math.cos(rad);
    const y2 = 20 + r2 * Math.sin(rad);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    );
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {rayLines}
      <circle cx="20" cy="20" r="9" fill="currentColor" />
    </svg>
  );
}

export function LeafMotif({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 4 C30 8, 34 18, 30 28 C26 36, 18 36, 14 30 C10 24, 12 14, 20 4 Z"
        fill="currentColor"
      />
      <path
        d="M20 4 C19 14, 17 22, 15 28"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MudclothPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="mudcloth"
          x="0"
          y="0"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="45" cy="25" r="1.5" fill="currentColor" />
          <circle cx="25" cy="45" r="1.5" fill="currentColor" />
          <path
            d="M5 30 L15 30 M50 5 L50 15 M30 50 L40 50"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M22 22 L28 22 L28 28 L22 28 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mudcloth)" />
    </svg>
  );
}
