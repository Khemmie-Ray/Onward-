import type { WhackIcon } from "./whackIcon";

export const FAMILY_SCAM_ICONS: Record<string, WhackIcon> = {
  seed_phrase_phishing: {
    id: "phishing-hook",
    src: "/whack-icons/phishing-hook.png",
    label: "Phishing hook",
  },
  fake_giveaway: {
    id: "devil-free-btc",
    src: "/whack-icons/devil-free-btc.png",
    label: "Fake giveaway",
  },
  urgent_action: {
    id: "bomb-coins",
    src: "/whack-icons/bomb-coins.png",
    label: "Urgent alert",
  },
  impersonation: {
    id: "shady-fox",
    src: "/whack-icons/shady-fox.png",
    label: "Impersonator",
  },
  wallet_drainer: {
    id: "rug-pull",
    src: "/whack-icons/rug-pull.png",
    label: "Drainer",
  },
};

export const LEGIT_ICON: WhackIcon = {
  id: "safe-shield",
  src: "/whack-icons/safe-shield.png",
  label: "Real activity",
};

export function getScamIconForFamily(family: string): WhackIcon {
  return (
    FAMILY_SCAM_ICONS[family] ?? {
      id: "skull-coins",
      src: "/whack-icons/skull-coins.png",
      label: "Scam",
    }
  );
}