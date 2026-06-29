export const TONE_MAP = {
  terracotta: {
    bg: "bg-terracotta",
    fg: "text-paper",
    subFg: "text-paper/85",
    subSubFg: "text-paper/70",
    muted: "text-paper/40",
    shadow: "shadow-[0_8px_24px_rgba(199,93,63,0.20)]",
    hoverTint: "hover:bg-terracotta-tint",
    ring: "ring-terracotta/30",
  },
  mustard: {
    bg: "bg-mustard",
    fg: "text-indigo",
    subFg: "text-indigo/85",
    subSubFg: "text-indigo/70",
    muted: "text-indigo/40",
    shadow: "shadow-[0_8px_24px_rgba(230,180,72,0.30)]",
    hoverTint: "hover:bg-mustard-tint",
    ring: "ring-mustard/40",
  },
  forest: {
    bg: "bg-forest",
    fg: "text-paper",
    subFg: "text-paper/85",
    subSubFg: "text-paper/70",
    muted: "text-paper/40",
    shadow: "shadow-[0_8px_24px_rgba(58,107,71,0.20)]",
    hoverTint: "hover:bg-forest-tint",
    ring: "ring-forest/30",
  },
  aubergine: {
    bg: "bg-aubergine",
    fg: "text-paper",
    subFg: "text-paper/85",
    subSubFg: "text-paper/70",
    muted: "text-paper/40",
    shadow: "shadow-[0_8px_24px_rgba(91,46,92,0.20)]",
    hoverTint: "hover:bg-aubergine-tint",
    ring: "ring-aubergine/30",
  },
  indigo: {
    bg: "bg-indigo",
    fg: "text-paper",
    subFg: "text-paper/85",
    subSubFg: "text-paper/70",
    muted: "text-paper/40",
    shadow: "shadow-[0_8px_24px_rgba(31,58,110,0.20)]",
    hoverTint: "hover:bg-paper",
    ring: "ring-indigo/30",
  },
} as const;


export const TINT_MAP = {
  mustard: {
    bg: "bg-mustard-tint",
    iconBg: "bg-mustard",
    iconColor: "text-indigo",
    textColor: "text-indigo",
    accent: "text-mustard",
    accentBg: "bg-mustard",
  },
  terracotta: {
    bg: "bg-terracotta-tint",
    iconBg: "bg-terracotta",
    iconColor: "text-paper",
    textColor: "text-indigo",
    accent: "text-terracotta",
    accentBg: "bg-terracotta",
  },
  forest: {
    bg: "bg-forest-tint",
    iconBg: "bg-forest",
    iconColor: "text-paper",
    textColor: "text-indigo",
    accent: "text-forest",
    accentBg: "bg-forest",
  },
  aubergine: {
    bg: "bg-aubergine-tint",
    iconBg: "bg-aubergine",
    iconColor: "text-paper",
    textColor: "text-indigo",
    accent: "text-aubergine",
    accentBg: "bg-aubergine",
  },
} as const;

export type Tone = keyof typeof TONE_MAP;
export type Tint = keyof typeof TINT_MAP;

export type ToneStyles = (typeof TONE_MAP)[Tone];
export type TintStyles = (typeof TINT_MAP)[Tint];

export function tone<T extends Tone>(name: T): (typeof TONE_MAP)[T] {
  return TONE_MAP[name];
}

export function tint<T extends Tint>(name: T): (typeof TINT_MAP)[T] {
  return TINT_MAP[name];
}

export type ModuleCategory =
  | "Foundations"
  | "Identity"
  | "Economics"
  | "Safety"
  | "Utility";

export const CATEGORY_TINT: Record<ModuleCategory, Tint> = {
  Foundations: "mustard",
  Identity: "forest",
  Economics: "aubergine",
  Safety: "terracotta",
  Utility: "forest",
};

export function tintForCategory(category: ModuleCategory): TintStyles {
  return TINT_MAP[CATEGORY_TINT[category]];
}

export type EcosystemCategory = "Earn" | "Spend" | "Connect" | "Governance";

export const ECOSYSTEM_CATEGORY_TINT: Record<EcosystemCategory, Tint> = {
  Earn: "mustard",
  Spend: "terracotta",
  Connect: "forest",
  Governance: "aubergine",
};

export function tintForEcosystemCategory(
  category: EcosystemCategory
): TintStyles {
  return TINT_MAP[ECOSYSTEM_CATEGORY_TINT[category]];
}