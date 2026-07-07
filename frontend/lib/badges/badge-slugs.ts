export type BadgeSlug = {
  slug: string;
  label: string;
  category:
    | "Foundations"
    | "Identity"
    | "Economics"
    | "Safety"
    | "Utility"
    | "Milestone";
  deprecated?: boolean;
};

// Live module badges
export const MODULE_BADGE_SLUGS: BadgeSlug[] = [
  {
    slug: "what-is-a-token",
    label: "What is a token?",
    category: "Foundations",
  },
  {
    slug: "who-built-gooddollar",
    label: "Who built GoodDollar?",
    category: "Foundations",
  },
  {
    slug: "what-is-gooddollar",
    label: "What is GoodDollar?",
    category: "Foundations",
  },
  {
    slug: "why-celo-fuse-xdc",
    label: "Why Celo, Fuse, and XDC?",
    category: "Foundations",
  },
  {
    slug: "daily-ubi-claim",
    label: "Your first daily claim",
    category: "Foundations",
  },
  {
    slug: "face-verification",
    label: "Why the face verification?",
    category: "Identity",
  },
  {
    slug: "good-id-offers",
    label: "GoodID and earning more",
    category: "Identity",
  },
  { slug: "wallet-keys", label: "Your wallet, your keys", category: "Safety" },
  {
    slug: "spotting-scams-in-the-wild",
    label: "Spotting scams in the wild",
    category: "Safety",
  },
];

export const DEPRECATED_BADGE_SLUGS: BadgeSlug[] = [
  {
    slug: "reserve-mechanics",
    label: "Reserve mechanics",
    category: "Economics",
    deprecated: true,
  },
  {
    slug: "gas-sponsorship",
    label: "Gas sponsorship",
    category: "Utility",
    deprecated: true,
  },
];

export const LEVEL_BADGE_SLUGS: BadgeSlug[] = [
  { slug: "level-25", label: "Level 25", category: "Milestone" },
  { slug: "level-50", label: "Level 50", category: "Milestone" },
  { slug: "level-100", label: "Level 100", category: "Milestone" },
];

export const ALL_BADGE_SLUGS: BadgeSlug[] = [
  ...MODULE_BADGE_SLUGS,
  ...DEPRECATED_BADGE_SLUGS,
  ...LEVEL_BADGE_SLUGS,
];
