export type WhackIcon = {
    id: string;
    src: string;
    label: string;
  };
  
  export const SCAM_ICONS: WhackIcon[] = [
    {
      id: "bomb-coins",
      src: "/whack-icons/bomb-coins.png",
      label: "Scam bomb",
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
    {
      id: "/whack-icons/rug-pull",
      src: "/whack-icons/rug-pull.png",
      label: "Rug pull",
    },
    {
      id: "phishing-hook",
      src: "/whack-icons/phishing-hook.png",
      label: "Phishing",
    },
    {
      id: "devil-free-btc",
      src: "/whack-icons/devil-free-btc.png",
      label: "Fake giveaway",
    },
  ];
  
  export const LEGIT_ICONS: WhackIcon[] = [
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
    {
      id: "safe-shield",
      src: "/whack-icons/safe-shield.png",
      label: "Safe",
    },
  ];
  
  export function randomScamIcon(): WhackIcon {
    return SCAM_ICONS[Math.floor(Math.random() * SCAM_ICONS.length)];
  }
  
  export function randomLegitIcon(): WhackIcon {
    return LEGIT_ICONS[Math.floor(Math.random() * LEGIT_ICONS.length)];
  }