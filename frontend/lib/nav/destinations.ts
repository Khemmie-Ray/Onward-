import {
  BookOpen,
  Gamepad2,
  Wallet,
  BarChart3,
  User,
  GraduationCap,
} from "lucide-react";

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
  badge?: NavBadge;
};

export const NAV_DESTINATIONS: NavDestination[] = [
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/board", label: "Leaderboard", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export function isActiveDestination(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
