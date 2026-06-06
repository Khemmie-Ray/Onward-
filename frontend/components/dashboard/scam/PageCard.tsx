import React from "react";
import { Globe } from "lucide-react";
import type { Scenario } from "@/lib/scam/patterns";

interface PageCardProps {
  scenario: Extract<Scenario, { kind: "page" }>;
}

const PageCard = ({ scenario }: PageCardProps) => {
  return (
    <div className="w-full max-w-[340px] rounded-[18px] overflow-hidden bg-paper shadow-[0_8px_24px_rgba(31,58,110,0.12)]">
      <div className="flex items-center gap-2 bg-canvas-warm px-4 py-2.5 border-b border-shadow">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <div className="flex-1 ml-2 rounded-md bg-paper px-3 py-1 text-[10.5px] font-mono text-fg-soft truncate flex items-center gap-1.5">
          <Globe size={9} strokeWidth={2.5} className="text-fg-faint flex-shrink-0" />
          {scenario.url}
        </div>
      </div>
      <div className="p-5">
        <h3 className="display text-[18px] font-bold leading-[1.2] text-indigo mb-2">
          {scenario.title}
        </h3>
        <p className="text-[12.5px] leading-[1.55] text-fg-soft mb-3">{scenario.body}</p>
        <div className="rounded-full bg-terracotta px-4 py-2 text-center text-[12px] font-bold text-paper cursor-pointer">
          Connect Wallet
        </div>
      </div>
    </div>
  );
}

export default PageCard;