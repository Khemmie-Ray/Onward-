"use client";

import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { PlayRightPanel } from "./panels/PlayRightPanel";
import { GameRightPanel } from "./panels/GameRightPanel";
import { BoardRightPanel } from "./panels/BoardRightPanel";
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
];

export function RightPanelOutlet() {
  const pathname = usePathname();
  const entry = RIGHT_PANELS.find((e) => e.match(pathname));
  if (!entry) return null;
  const { Panel } = entry;

  return (
    <aside className="no-scrollbar hidden h-full w-full flex-col gap-3 overflow-y-auto py-6 px-4 xl:flex">
      <StatBar />
      <Panel />
    </aside>
  );
}
