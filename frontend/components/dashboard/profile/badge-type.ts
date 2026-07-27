export type OnchainBadge = {
  slug: string;
  label: string;
  category: string;
  deprecated: boolean;
  owned: boolean;
  tokenId: string | null;
  tokenURI: string | null;
  explorerUrl?: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
  } | null;
};

export type BadgesResponse = {
  owned: OnchainBadge[];
  unearned: OnchainBadge[];
  total_owned: number;
};

export type Category =
  | "Foundations"
  | "Identity"
  | "Economics"
  | "Safety"
  | "Utility";

export function resolveCategory(cat: string): Category {
  switch (cat) {
    case "Foundations":
    case "Identity":
    case "Economics":
    case "Safety":
    case "Utility":
      return cat;
    default:
      return "Utility";
  }
}

export function resolveImage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${raw.slice(7)}`
    : raw;
}