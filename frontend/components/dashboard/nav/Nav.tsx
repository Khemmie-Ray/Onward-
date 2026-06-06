"use client"

import { TopTabs } from "./TopTabs";
import { MobileTabBar } from "./MobileTabbar";
import {
  NAV_DESTINATIONS,
  type NavDestination,
  type NavBadge,
} from "@/lib/nav/destinations";

export function Nav({
  badges,
}: {
  badges?: Record<string, NavBadge>;
}) {
  const destinations: NavDestination[] = badges
    ? NAV_DESTINATIONS.map((dest) =>
        badges[dest.href] ? { ...dest, badge: badges[dest.href] } : dest
      )
    : NAV_DESTINATIONS;

  return (
    <>
      <TopTabs destinations={destinations} />
      <MobileTabBar destinations={destinations} />
    </>
  );
}