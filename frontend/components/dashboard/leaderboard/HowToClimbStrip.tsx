"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HowToClimbStrip() {
  return (
    <div className="mt-20 pt-6 border-t border-fg-soft/15">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3 gap-y-2 text-[12px] text-fg-soft">
        <span>Pass rounds, climb the board.</span>
        <Dot />
        <span>
          Rank 1 wins{" "}
          <span className="font-bold text-mustard tabular-nums">80 G$</span>,
          ranks 2 to 3 win{" "}
          <span className="font-bold text-mustard tabular-nums">40 G$</span>,
          ranks 4 to 10 win{" "}
          <span className="font-bold text-mustard tabular-nums">20 G$</span>{" "}
          each, every Sunday.
        </span>
        <Dot />
        <span>Premium rounds count too.</span>
        <Link
          href="/play"
          className="inline-flex items-center gap-1 text-indigo font-bold hover:underline sm:ml-auto"
        >
          Play a round
          <ArrowRight size={12} strokeWidth={2.8} />
        </Link>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="hidden sm:inline opacity-40">·</span>;
}