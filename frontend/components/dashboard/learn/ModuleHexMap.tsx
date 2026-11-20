"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { ModuleHex, type HexModule } from "./ModuleHex";

const COLS = 3;

export function ModuleHexMap({
  modules,
  onOpenModule,
  width = 104,
}: {
  modules: HexModule[];
  onOpenModule?: (slug: string) => void;
  width?: number;
}) {
  const W = width;
  const H = Math.round(W * 1.1547);
  const rowStep = Math.round(H * 0.75);
  const half = W / 2;

  const rowCount = Math.max(1, Math.ceil(modules.length / COLS));

  const placed = modules.map((m, i) => {
    const row = Math.floor(i / COLS); 
    const idxInRow = i % COLS;
    const col = row % 2 === 1 ? COLS - 1 - idxInRow : idxInRow;
    return { m, row, col };
  });

  const xFor = (row: number, col: number) =>
    col * W + (row % 2 === 1 ? -half : 0) + half;

  const yFor = (row: number) => (rowCount - 1 - row) * rowStep + rowStep;

  const gridW = 3 * W + half;

  const gridH = rowCount * rowStep + H;

  const badgeRow = rowCount;
  const badgeX = xFor(badgeRow, 1);
  const badgeY = yFor(badgeRow); 

  const drawOrder = [...placed].sort((a, b) => b.row - a.row);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = containerW > 0 ? Math.min(1, containerW / gridW) : 1;

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      <div style={{ width: gridW * scale, height: gridH * scale }}>
        <div
          className="relative"
          style={{
            width: gridW,
            height: gridH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Track badge, nested above the top row */}
          <Cell x={badgeX} y={badgeY} w={W} h={H}>
            <BadgeHex />
          </Cell>

          {drawOrder.map(({ m, row, col }) => (
            <Cell key={m.slug} x={xFor(row, col)} y={yFor(row)} w={W} h={H}>
              <ModuleHex module={m} width={W} onOpen={onOpenModule} />
            </Cell>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({
  x,
  y,
  w,
  h,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: ReactNode;
}) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      {children}
    </div>
  );
}

function BadgeHex() {
  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 100 115"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <polygon
          points="50,1.5 99,29 99,86.5 50,114 1,86.5 1,29"
          fill="transparent"
          stroke="#E6B448"
          strokeWidth={3}
          strokeDasharray="4 5"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-mustard">
        <Star size={20} strokeWidth={2} className="fill-mustard" />
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
          badge
        </span>
      </span>
    </div>
  );
}

export function HexLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-paper/70">
      <LegendItem label="Done">
        <span className="h-3 w-3 rounded-[3px] bg-[#5CC27C]" />
      </LegendItem>
      <LegendItem label="In progress">
        <span className="h-3 w-3 rounded-[3px] border-2 border-mustard" />
      </LegendItem>
      <LegendItem label="Up next">
        <span className="h-3 w-3 rounded-[3px] border-2 border-dashed border-paper/60" />
      </LegendItem>
      <LegendItem label="Locked">
        <span className="h-3 w-3 rounded-[3px] border-2 border-paper/15" />
      </LegendItem>
    </div>
  );
}

function LegendItem({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {children}
      {label}
    </span>
  );
}
