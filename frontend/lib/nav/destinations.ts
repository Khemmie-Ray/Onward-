import { BookOpen, Gamepad2, Wallet, BarChart3, User } from "lucide-react";
import type { Tone } from "../themes/tones";

export type NavBadge = {
  text?: string;
  pulse?: boolean;
};

export type NavDestination = {
  href: string;
  label: string;
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
  >;
  tone: Tone;
  badge?: NavBadge;
};


export const NAV_DESTINATIONS: NavDestination[] = [
  { href: "/learn", label: "Learn", icon: BookOpen, tone: "mustard" },
  { href: "/play", label: "Play", icon: Gamepad2, tone: "terracotta" },
  { href: "/wallet", label: "Wallet", icon: Wallet, tone: "indigo" },
  { href: "/board", label: "Leaderboard", icon: BarChart3, tone: "forest" },
  { href: "/profile", label: "Profile", icon: User, tone: "aubergine" },
];

export function isActiveDestination(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
