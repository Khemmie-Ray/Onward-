import type { EcosystemApp } from "./type";

export const APPS: EcosystemApp[] = [
  {
    slug: "gooddapp",
    name: "GoodDapp",
    builder: "GoodDollar Foundation",
    category: "Earn",
    status: "available",
    tagline: "The daily claim, simplified.",
    description:
      "The official GoodDollar wallet. Claim your daily UBI, hold g$, send to friends, and track your verification status all in one place.",
    tutorialMinutes: 6,
    reward: 30,
    highlights: [
      "Claim daily g$ in one tap",
      "Send g$ to a phone number",
      "Track your verification expiry",
    ],
    isFeatured: true,
  },
  {
    slug: "good-collective",
    name: "GoodCollective",
    builder: "GoodDollar Foundation",
    category: "Earn",
    status: "available",
    tagline: "Direct income for verified humans.",
    description:
      "Join collectives that distribute additional income to verified members. Climate stewards, students, caregivers — get paid for who you are.",
    tutorialMinutes: 7,
    reward: 35,
    highlights: [
      "Browse open collectives",
      "Apply to join one",
      "Receive recurring payouts",
    ],
    isFeatured: true,
  },
  {
    slug: "ubi-mini-app",
    name: "UBI Mini App",
    builder: "Builders DAO",
    category: "Earn",
    status: "available",
    tagline: "Claim from your phone's home screen.",
    description:
      "Add the UBI mini app to your home screen and claim g$ without opening a browser. Built for the lowest possible friction.",
    tutorialMinutes: 4,
    reward: 20,
    highlights: [
      "Install as PWA",
      "Daily push notifications",
      "Offline-friendly UI",
    ],
    isNew: true,
  },
  {
    slug: "celo-swap",
    name: "G$ Swap on Mento",
    builder: "Mento Labs",
    category: "Spend",
    status: "available",
    tagline: "Trade g$ for other stablecoins.",
    description:
      "Swap your g$ to cUSD, cEUR, or CELO directly through Mento's onchain reserve. Always liquid, no slippage on small amounts.",
    tutorialMinutes: 5,
    reward: 25,
    highlights: [
      "Connect your wallet",
      "Read the swap rate",
      "Execute a small test swap",
    ],
  },
  {
    slug: "good-id-wallet",
    name: "GoodID Wallet",
    builder: "GoodDollar Foundation",
    category: "Connect",
    status: "available",
    tagline: "Your decentralized identity, your rules.",
    description:
      "Manage your GoodID credentials. See what's shared, what's private, and which partner apps have requested access.",
    tutorialMinutes: 6,
    reward: 30,
    highlights: [
      "View your credentials",
      "Control sharing permissions",
      "Disconnect partner apps",
    ],
  },
  {
    slug: "good-governance",
    name: "GoodDAO",
    builder: "GoodDollar Foundation",
    category: "Governance",
    status: "available",
    tagline: "Vote on what GoodDollar becomes next.",
    description:
      "Read active proposals, see arguments from both sides, cast your vote. Your g$ holdings determine your voting weight.",
    tutorialMinutes: 8,
    reward: 40,
    highlights: [
      "Read an active proposal",
      "Understand voting weight",
      "Cast your first vote",
    ],
  },
  {
    slug: "merchant-pay",
    name: "Merchant Pay",
    builder: "Local Builders",
    category: "Spend",
    status: "coming-soon",
    tagline: "Spend g$ at local vendors.",
    description:
      "A QR-based payment app for local merchants accepting g$. Pilot launching in Lagos and Nairobi.",
    tutorialMinutes: 5,
    reward: 25,
    highlights: [
      "Scan a merchant QR",
      "Confirm payment in g$",
      "Receive a receipt onchain",
    ],
  },
  {
    slug: "remittance",
    name: "Cross-Border Send",
    builder: "Diaspora Tools",
    category: "Spend",
    status: "coming-soon",
    tagline: "Send g$ across borders, settle in local currency.",
    description:
      "Family abroad sends g$, recipient cashes out to local mobile money. Built for the African diaspora corridor.",
    tutorialMinutes: 6,
    reward: 30,
    highlights: [
      "Send g$ to a phone number",
      "Recipient claims to mobile money",
      "Onchain receipt for both sides",
    ],
  },
];