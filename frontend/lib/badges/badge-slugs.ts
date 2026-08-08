export type BadgeSlug = {
  slug: string;
  label: string;
  category: string;
  deprecated?: boolean;
};

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

export const LEARN_BADGE_SLUGS: BadgeSlug[] = [
  {
    slug: "money-on-the-internet",
    label: "Money that lives on the internet",
    category: "The world of digital money",
  },
  {
    slug: "why-anyone-made-this",
    label: "Why anyone made this",
    category: "The world of digital money",
  },
  {
    slug: "who-runs-it",
    label: "How strangers agree without trusting each other",
    category: "The world of digital money",
  },
  {
    slug: "what-you-can-do",
    label: "What you can actually do with it",
    category: "The world of digital money",
  },
  {
    slug: "what-a-wallet-is",
    label: "What a wallet is",
    category: "Wallets",
  },
  {
    slug: "what-your-wallet-holds",
    label: "What your wallet actually holds",
    category: "Wallets",
  },
  {
    slug: "wallets-people-use",
    label: "The wallets people actually use",
    category: "Wallets",
  },
  {
    slug: "setting-up-your-wallet",
    label: "Setting up a wallet you control",
    category: "Wallets",
  },
  {
    slug: "your-address-is-your-identity",
    label: "Your address is who you are on-chain",
    category: "Wallets",
  },
  {
    slug: "your-address-is-public",
    label: "Sharing your address, safely",
    category: "Wallets",
  },
  {
    slug: "key-you-never-share",
    label: "The key you never share",
    category: "Wallets",
  },
  {
    slug: "words-that-restore-everything",
    label: "The words that restore everything",
    category: "Wallets",
  },
  {
    slug: "hot-and-cold-wallets",
    label: "Hot wallets and cold wallets",
    category: "Wallets",
  },
  {
    slug: "not-one-blockchain",
    label: "Not one blockchain, many",
    category: "Networks",
  },
  {
    slug: "bitcoin-the-original",
    label: "Bitcoin, the original",
    category: "Networks",
  },
  {
    slug: "ethereum-and-apps",
    label: "Ethereum and the world of apps",
    category: "Networks",
  },
  {
    slug: "solana-and-other-worlds",
    label: "Solana and other worlds",
    category: "Networks",
  },
  {
    slug: "evm-shared-language",
    label: "EVM, a shared language",
    category: "Networks",
  },
  {
    slug: "layers-base-and-top",
    label: "Layers: base and on top",
    category: "Networks",
  },
  {
    slug: "sidechains-and-bridges",
    label: "Sidechains and bridges",
    category: "Networks",
  },
  {
    slug: "wrong-network",
    label: "Sending to the wrong network",
    category: "Networks",
  },
];

export const ALL_BADGE_SLUGS: BadgeSlug[] = [
  ...MODULE_BADGE_SLUGS,
  ...DEPRECATED_BADGE_SLUGS,
  ...LEARN_BADGE_SLUGS,
  ...LEVEL_BADGE_SLUGS,
];
