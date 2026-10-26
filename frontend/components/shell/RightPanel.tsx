"use client";

import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { PlayRightPanel } from "./panels/PlayRightPanel";
import { GameRightPanel } from "./panels/GameRightPanel";
import { BoardRightPanel } from "./panels/BoardRightPanel";
import { ProfileRightPanel } from "./panels/ProfileRightPanel";
import { WalletRightPanel } from "./panels/WalletRightPanel";
import { StatBar } from "./StatBar";

type PanelEntry = {
  match: (pathname: string) => boolean;
  Panel: ComponentType;
};

const RIGHT_PANELS: PanelEntry[] = [
  { match: (p) => p.startsWith("/play/"), Panel: GameRightPanel },
  { match: (p) => p === "/play" || p === "/learn", Panel: PlayRightPanel },
  {
    match: (p) => p === "/board" || p.startsWith("/board/"),
    Panel: BoardRightPanel,
  },
  {
    match: (p) => p === "/profile" || p.startsWith("/profile/"),
    Panel: ProfileRightPanel,
  },
  {
    match: (p) => p === "/wallet" || p.startsWith("/wallet/"),
    Panel: WalletRightPanel,
  },
];

export function getRightPanel(pathname: string): ComponentType | null {
  return RIGHT_PANELS.find((e) => e.match(pathname))?.Panel ?? null;
}

export function RightPanelContent() {
  const pathname = usePathname();
  const Panel = getRightPanel(pathname);
  if (!Panel) return null;
  return (
    <>
      <StatBar />
      <Panel />
    </>
  );
}

export function RightPanelOutlet() {
  const pathname = usePathname();
  const Panel = getRightPanel(pathname);
  if (!Panel) return null;

  return (
    <aside className="no-scrollbar hidden h-full w-full flex-col gap-3 overflow-y-auto py-6 px-4 xl:flex">
      <StatBar />
      <Panel />
    </aside>
  );
}
