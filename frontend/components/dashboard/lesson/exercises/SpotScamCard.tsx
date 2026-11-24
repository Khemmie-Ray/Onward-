"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Eye,
  Globe,
  Mail,
  MessageCircle,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ScamChannel,
  SpotScamCard as SpotScamCardData,
} from "@/lib/lessons/lesson-data";
import { ExerciseFrame } from "./ExerciseFrame";

const CHANNEL: Record<ScamChannel, { label: string; icon: LucideIcon }> = {
  situation: { label: "The situation", icon: Eye },
  dm: { label: "Direct message", icon: MessageCircle },
  whatsapp: { label: "Chat message", icon: MessageCircle },
  sms: { label: "Text message", icon: MessageCircle },
  tweet: { label: "Social post", icon: MessageCircle },
  email: { label: "Email", icon: Mail },
  wallet_popup: { label: "Wallet request", icon: Wallet },
  web_page: { label: "Web page", icon: Globe },
  in_person: { label: "Someone tells you", icon: User },
};

type Pick = "real" | "scam";

const OPTIONS: {
  value: Pick;
  label: string;
  icon: LucideIcon;
  idle: string;
}[] = [
  {
    value: "real",
    label: "Real",
    icon: ShieldCheck,
    idle: "border-forest bg-forest-tint text-forest",
  },
  {
    value: "scam",
    label: "Scam",
    icon: AlertTriangle,
    idle: "border-terracotta bg-terracotta-tint text-terracotta",
  },
];

/** A message or screen as it would arrive. Real or scam? */
export function SpotScamCard({
  data,
  verdict,
  onDraft,
}: {
  data: SpotScamCardData;
  verdict: boolean | null;
  onDraft: (answer: Pick | null) => void;
}) {
  const [picked, setPicked] = useState<Pick | null>(null);
  const checked = verdict !== null;

  const pick = (value: Pick) => {
    if (checked) return;
    setPicked(value);
    onDraft(value);
  };

  const look = (value: Pick, idle: string) => {
    if (checked) {
      if (value === data.answer) return "border-forest bg-forest text-paper";
      if (value === picked) return "border-terracotta bg-terracotta text-paper";
      return `${idle} opacity-50`;
    }
    if (value === picked) return "border-indigo bg-indigo text-paper";
    return `${idle} hover:-translate-y-0.5`;
  };

  return (
    <ExerciseFrame label="Real or scam?">
      <Message data={data} />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {OPTIONS.map(({ value, label, icon: Icon, idle }) => (
          <button
            key={value}
            type="button"
            onClick={() => pick(value)}
            disabled={checked}
            aria-pressed={picked === value}
            className={`flex min-h-21 flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-b-[5px] text-[16px] font-bold transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-default ${look(value, idle)}`}
          >
            <Icon size={22} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>
    </ExerciseFrame>
  );
}

function Message({ data }: { data: SpotScamCardData }) {
  const { label, icon: Icon } = CHANNEL[data.channel];

  const header = (
    <div className="flex items-center gap-2.5 text-paper">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-soft">
        <Icon size={18} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        {data.sender && (
          <div className="truncate text-[14px] font-bold">{data.sender}</div>
        )}
        <div
          className={
            data.sender ? "text-[12px] text-paper/65" : "text-[13px] font-bold"
          }
        >
          {label}
        </div>
      </div>
    </div>
  );

  let body;
  if (data.channel === "web_page") {
    body = (
      <div className="overflow-hidden rounded-2xl bg-paper">
        <div className="flex items-center gap-2 border-b border-shadow bg-canvas-warm px-3 py-2 text-[12px] text-fg-soft">
          <Globe size={13} />
          <span className="truncate font-medium text-indigo">
            {data.sender ?? "website"}
          </span>
        </div>
        <p className="whitespace-pre-line p-4 text-[14px] leading-[1.55] text-indigo">
          {data.body}
        </p>
      </div>
    );
  } else if (data.channel === "wallet_popup") {
    body = (
      <p className="whitespace-pre-line rounded-2xl bg-paper p-3.5 font-mono text-[12.5px] leading-normal text-indigo">
        {data.body}
      </p>
    );
  } else if (data.channel === "email" || data.channel === "situation") {
    body = (
      <p className="whitespace-pre-line rounded-2xl bg-paper p-4 text-[14px] leading-[1.55] text-indigo">
        {data.body}
      </p>
    );
  } else {
    body = (
      <p className="max-w-[92%] self-start whitespace-pre-line rounded-[18px] rounded-bl-md bg-paper px-3.5 py-3 text-[14px] leading-[1.55] text-indigo">
        {data.body}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-[26px] bg-indigo p-4">
      {header}
      {body}
    </div>
  );
}
