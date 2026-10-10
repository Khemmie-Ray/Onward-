import {
  AlertTriangle,
  Droplets,
  Award,
  BadgeCheck,
  Banknote,
  BookOpen,
  Boxes,
  CircleDollarSign,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  Flame,
  Gift,
  Globe,
  HandCoins,
  Info,
  KeyRound,
  Landmark,
  Link2,
  Lock,
  type LucideIcon,
  Network,
  Percent,
  Repeat,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Waves,
  Zap,
} from "lucide-react";

export const CARD_BRAND_ICONS: Partial<Record<string, string>> = {
  metamask:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1785544483/onward/metamask_efscln.png",
  trustwallet:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1785544484/onward/trust-wallet_d2tcup.png",
  phantom:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1785544484/onward/Phantom_Wallet_sgku1g.png",
  rainbow:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1785544484/onward/rainbow_f2n9lg.png",
  minipay:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1785544484/onward/minipay_xb6sao.png",
  bitcoin:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1786139215/onward/btc-logo_puwtsg.webp",
  ethereum:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1786139217/onward/Ethereum_Logo_othhcd.png",
  solana:
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1786139216/onward/solana_tdj4ld.png",
};

export const CARD_CONCEPT_ICONS: Partial<Record<string, LucideIcon>> = {
  coins: Coins,
  cash: Banknote,
  dollar: CircleDollarSign,
  earn: HandCoins,
  price_up: TrendingUp,
  price_down: TrendingDown,
  percent: Percent,
  bank: Landmark,
  shop: Store,

  network: Network,
  globe: Globe,
  link: Link2,
  blocks: Boxes,
  fast: Zap,

  // wallets and keys
  wallet: Wallet,
  key: KeyRound,
  lock: Lock,
  phone: Smartphone,
  download: Download,

  // safety
  warning: AlertTriangle,
  shield_alert: ShieldAlert,
  shield_check: ShieldCheck,
  verified: BadgeCheck,
  watch_out: Eye,

  // learning and progress
  info: Info,
  lesson: BookOpen,
  award: Award,
  streak: Flame,
  sparkle: Sparkles,
  gift: Gift,

  // people and process
  users: Users,
  swap: Repeat,
  send: Send,
  card: CreditCard,
  balance: Scale,
  time: Clock,
  liquidity: Droplets,
  pool: Waves,
};

/** Every key a card's `icon` field may use. */
export const VALID_CARD_ICONS = [
  ...Object.keys(CARD_BRAND_ICONS),
  ...Object.keys(CARD_CONCEPT_ICONS),
] as const;

export function resolveCardIcon(
  key: string | undefined,
):
  | { kind: "brand"; url: string }
  | { kind: "concept"; Icon: LucideIcon }
  | null {
  if (!key) return null;

  const url = CARD_BRAND_ICONS[key];
  if (url) return { kind: "brand", url };

  const Icon = CARD_CONCEPT_ICONS[key];
  if (Icon) return { kind: "concept", Icon };
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[card icon] unknown icon key "${key}"`);
  }
  return null;
}
