export type WhackIcon = {
  id: string;
  src: string;
  label: string;
};

const PLACEHOLDER_SRC = "/whack-icons/placeholder.png"; 

export const ICONS: WhackIcon[] = [
  {
    id: "bomb-coins",
    src: "/whack-icons/bomb-coins.png",
    label: "Urgent alert",
  },
  {
    id: "shady-fox",
    src: "/whack-icons/shady-fox.png",
    label: "Shady operator",
  },
  {
    id: "skull-coins",
    src: "/whack-icons/skull-coins.png",
    label: "Dead money",
  },
  { id: "rug-pull", src: "/whack-icons/rug-pull.png", label: "Rug pull" },
  {
    id: "phishing-hook",
    src: "/whack-icons/phishing-hook.png",
    label: "Phishing hook",
  },
  {
    id: "devil-free-btc",
    src: "/whack-icons/devil-free-btc.png",
    label: "Fake giveaway",
  },
  {
    id: "verified-coin",
    src: "/whack-icons/verified-coin.png",
    label: "Verified",
  },
  {
    id: "padlock-check",
    src: "/whack-icons/padlock-check.png",
    label: "Secured",
  },
  {
    id: "checkmark-circle",
    src: "/whack-icons/checkmark-circle.png",
    label: "Approved",
  },
  { id: "safe-shield", src: "/whack-icons/safe-shield.png", label: "Safe" },

  // ── Seed phrase phishing ──
  { id: "key-grab", src: "/whack-icons/key-grab.png", label: "Key grab" }, 
  { id: "fake-recovery", src: "/whack-icons/fake-recovery.png", label: "Fake recovery" }, 
  { id: "seed-trap", src: "/whack-icons/seed-trap.png", label: "Seed trap" }, 

  // ── Fake giveaway ──
  { id: "gift-trap", src: "/whack-icons/gift-trap.png", label: "Gift trap" }, 
  { id: "airdrop-bait", src: "/whack-icons/airdrop-bait.png", label: "Airdrop bait" }, 
  { id: "double-your-coins", src: "/whack-icons/double-your-coins.png", label: "Double your money" }, 

  // ── Urgent action ──
  { id: "countdown", src: "/whack-icons/countdown.png", label: "Countdown pressure" }, 
  { id: "account-locked", src: "/whack-icons/account-locked.png", label: "Account locked" }, 
  { id: "sos-plea", src: "/whack-icons/sos-plea.png", label: "Emergency plea" }, 

  // ── Impersonation ──
  { id: "fake-badge", src: "/whack-icons/fake-badge.png", label: "Fake verified" }, 
  { id: "mask-face", src: "/whack-icons/mask-face.png", label: "Impersonator" }, 
  { id: "typosquat", src: "/whack-icons/typosquat.png", label: "Lookalike handle" }, 

  // ── Wallet drainer ──
  { id: "approve-all", src: "/whack-icons/approve-all.png", label: "Approve-all trap" }, 
  { id: "blind-sign", src: "/whack-icons/blind-sign.png", label: "Blind signature" }, 
  { id: "permit-drain", src: "/whack-icons/permit-drain.png", label: "Permit drain" }, 

  // ── Fake payment ──
  { id: "fake-receipt", src: "/whack-icons/fake-receipt.png", label: "Fake receipt" }, 
  { id: "pending-forever", src: "/whack-icons/pending-forever.png", label: "Fake pending" }, 
  { id: "overpay-refund", src: "/whack-icons/overpay-refund.png", label: "Overpayment trick" }, 

  // ── Recovery scam (NEW) ──
  { id: "recovery-agent", src: "/whack-icons/recovery-agent.png", label: "Fake recovery agent" }, 
  { id: "funds-returned", src: "/whack-icons/funds-returned.png", label: "Fake fund return" }, 

  // ── Romance / pig-butchering (NEW) ──
  { id: "heart-trap", src: "/whack-icons/heart-trap.png", label: "Romance trap" }, 
  { id: "love-invest", src: "/whack-icons/love-invest.png", label: "Sweetheart investment" }, 

  // ── Job / task scam (NEW) ──
  { id: "deposit-trap", src: "/whack-icons/deposit-trap.png", label: "Deposit-to-earn" }, 
  { id: "task-bait", src: "/whack-icons/task-bait.png", label: "Task bait" }, 

  // ── Fake app / extension (NEW) ──
  { id: "clone-app", src: "/whack-icons/clone-app.png", label: "Clone app" }, 
  {
    id: "malicious-extension",
    src: "/whack-icons/malicious-extension.png",
    label: "Malicious extension",
  }, 

  // ── Extra safe icons for legit variety ──
  { id: "safe-official", src: "/whack-icons/safe-official.png", label: "Official" }, 
];

const ICON_MAP: Record<string, WhackIcon> = Object.fromEntries(
  ICONS.map((i) => [i.id, i]),
);

const DEFAULT_SCAM: WhackIcon = ICON_MAP["skull-coins"];
const DEFAULT_LEGIT: WhackIcon = ICON_MAP["safe-shield"];

export function iconById(
  iconId: string | null | undefined,
  isScam: boolean,
): WhackIcon {
  if (iconId && ICON_MAP[iconId]) return ICON_MAP[iconId];
  return isScam ? DEFAULT_SCAM : DEFAULT_LEGIT;
}

export const SCAM_ICONS: WhackIcon[] = ICONS.filter(
  (i) =>
    !i.id.startsWith("safe-") &&
    !["verified-coin", "padlock-check", "checkmark-circle"].includes(i.id),
);
export const LEGIT_ICONS: WhackIcon[] = ICONS.filter(
  (i) =>
    i.id.startsWith("safe-") ||
    ["verified-coin", "padlock-check", "checkmark-circle"].includes(i.id),
);
export function randomScamIcon(): WhackIcon {
  return SCAM_ICONS[Math.floor(Math.random() * SCAM_ICONS.length)];
}
export function randomLegitIcon(): WhackIcon {
  return LEGIT_ICONS[Math.floor(Math.random() * LEGIT_ICONS.length)];
}
