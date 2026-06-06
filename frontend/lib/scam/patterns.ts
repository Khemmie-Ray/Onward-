export type ScamCategory =
  | "impersonation"
  | "urgency"
  | "phishing"
  | "fake_giveaway"
  | "support_scam"
  | "legit";

export type ScenarioKind = "dm" | "tweet" | "wallet_popup" | "page";

export type Scenario =
  | {
      kind: "dm";
      platform: "Telegram" | "Discord" | "WhatsApp";
      sender: string;
      senderHandle?: string;
      avatarStyle?: "verified" | "stranger";
      body: string;
    }
  | {
      kind: "tweet";
      handle: string;
      displayName: string;
      verified: boolean;
      body: string;
    }
  | {
      kind: "wallet_popup";
      title: string;
      action: string;
      detail: string;
    }
  | {
      kind: "page";
      url: string;
      title: string;
      body: string;
    };

export type ScamPattern = {
  id: string;
  category: ScamCategory;
  isScam: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  scenario: Scenario;
  teaching: string;
};

export const MOCK_PATTERNS: ScamPattern[] = [
  {
    id: "p1",
    category: "support_scam",
    isScam: true,
    difficulty: 1,
    scenario: {
      kind: "dm",
      platform: "Telegram",
      sender: "Anna | GoodDollar Team",
      avatarStyle: "stranger",
      body: "Hi! I see your wallet has an issue. Send me your seed phrase and I'll fix it in 2 minutes.",
    },
    teaching: "The GoodDollar team will never DM you and never ask for your seed phrase. Block the account.",
  },
  {
    id: "p2",
    category: "fake_giveaway",
    isScam: true,
    difficulty: 1,
    scenario: {
      kind: "page",
      url: "gooddollar-rewards.xyz",
      title: "Claim 5,000 G$ Now!",
      body: "Limited time offer — connect your wallet to receive your reward.",
    },
    teaching: "Real claims happen inside GoodWallet at a fixed daily window. No external site promises huge sums.",
  },
  {
    id: "p3",
    category: "legit",
    isScam: false,
    difficulty: 1,
    scenario: {
      kind: "wallet_popup",
      title: "Daily UBI Claim",
      action: "Tap to claim today's g$",
      detail: "Your next claim unlocks tomorrow at 12pm UTC.",
    },
    teaching: "This is the real flow. In-app prompt, expected action, no external link, no info requested.",
  },
  {
    id: "p4",
    category: "impersonation",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "tweet",
      handle: "@gooddollar_official",
      displayName: "GoodDollar Official",
      verified: false,
      body: "🚀 New airdrop live! Claim 500 G$ at gooddollar-rewards.xyz",
    },
    teaching: "Wrong handle (_official suffix), wrong URL (real is gooddollar.org). Three tells visible if you slow down.",
  },
  {
    id: "p5",
    category: "urgency",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "dm",
      platform: "WhatsApp",
      sender: "+234 803 555 0142",
      avatarStyle: "stranger",
      body: "I'm in hospital and need help. Please send 200 G$ to wallet 0x4f3c…a829. I'll repay double next week.",
    },
    teaching: "Strangers in crisis don't appear in DMs randomly. Repayment promises from strangers are 100% scams.",
  },
  {
    id: "p6",
    category: "legit",
    isScam: false,
    difficulty: 1,
    scenario: {
      kind: "wallet_popup",
      title: "Approve transaction",
      action: "Swap 50 G$ to cUSD on Mento",
      detail: "Gas: 0.001 CELO",
    },
    teaching: "Specific amount, known protocol, reasonable gas, no unlimited approval language. This is a real transaction.",
  },
  {
    id: "p7",
    category: "phishing",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "wallet_popup",
      title: "Re-verify identity",
      action: "Enter your 12-word recovery phrase",
      detail: "Your account will be suspended in 24 hours if not verified.",
    },
    teaching: "Identity verification is your face, not your seed phrase. Anyone asking for a recovery phrase is stealing your wallet.",
  },
  {
    id: "p8",
    category: "fake_giveaway",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "page",
      url: "celo-airdrop.io",
      title: "Stake G$ at 847% APY!",
      body: "Limited spots. Connect wallet to lock in your position.",
    },
    teaching: "No legitimate yield product offers triple-digit APYs. This is bait for your tokens.",
  },
  {
    id: "p9",
    category: "legit",
    isScam: false,
    difficulty: 1,
    scenario: {
      kind: "tweet",
      handle: "@gooddollarorg",
      displayName: "GoodDollar",
      verified: true,
      body: "Reminder: claim your daily UBI in GoodDapp before midnight UTC. No external links, no third-party sites needed.",
    },
    teaching: "Verified handle, correct domain, no link to claim sites, just a reminder pointing back to the official app.",
  },
  {
    id: "p10",
    category: "impersonation",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "dm",
      platform: "Discord",
      sender: "Support | GoodDollar Help",
      avatarStyle: "stranger",
      body: "Hello! Click here to recover your missed claim from yesterday: bit.ly/g-recover",
    },
    teaching: "Missed claims aren't recoverable. Support never DMs first. Shortened links hide the real destination.",
  },
  {
    id: "p11",
    category: "urgency",
    isScam: true,
    difficulty: 2,
    scenario: {
      kind: "page",
      url: "claim-rewards-now.app",
      title: "FINAL HOURS: Claim 10,000 G$",
      body: "Send 1 CELO to confirm your wallet and unlock your reward.",
    },
    teaching: "You never pay anything to receive crypto. Anyone asking you to send first to receive more is robbing you.",
  },
  {
    id: "p12",
    category: "legit",
    isScam: false,
    difficulty: 1,
    scenario: {
      kind: "wallet_popup",
      title: "GoodID consent",
      action: "Approve sharing region with this dApp",
      detail: "You can revoke this anytime from your GoodID wallet.",
    },
    teaching: "Specific scope (region only), revocable, in-app prompt. Real consent flows give you control.",
  },
];

export function generateRound(count = 8): ScamPattern[] {
  const shuffled = [...MOCK_PATTERNS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}