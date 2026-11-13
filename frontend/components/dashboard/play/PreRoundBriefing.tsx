"use client";

import { Loader2, Play } from "lucide-react";

type ExemplarShape = {
  kind: string;
  content: Record<string, unknown>;
  teaching: string;
};

const asStr = (v: unknown) => (typeof v === "string" ? v : "");

const SCAM_MOLES = [
  "/whack-icons/scam-hat.svg",
  "/whack-icons/scam-hoodie.svg",
  "/whack-icons/scam-disguise.svg",
];

function scenarioPreview(exemplar?: ExemplarShape) {
  const c = exemplar?.content ?? {};
  const body = asStr(c.body) || asStr(c.detail) || exemplar?.teaching || "";

  let meta = "";
  switch (exemplar?.kind) {
    case "dm":
      meta = [asStr(c.sender), asStr(c.platform), "new contact"]
        .filter(Boolean)
        .join(" · ");
      break;
    case "tweet":
      meta = [
        asStr(c.displayName),
        asStr(c.handle) ? `@${asStr(c.handle)}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      break;
    case "wallet_popup":
      meta = asStr(c.title) || "Wallet request";
      break;
    default:
      meta = asStr(c.url) || asStr(c.title) || "";
  }
  return { meta, body };
}

export function PreRoundBriefing({
  familyLabel,
  familyDescription,
  exemplar,
  onReady,
  isStarting = false,
  ctaLabel = "Got it, start the round",
}: {
  familyLabel: string;
  familyDescription: string;
  exemplar?: ExemplarShape;
  onReady: () => void;
  isStarting?: boolean;
  ctaLabel?: string;
}) {
  const { meta, body } = scenarioPreview(exemplar);

  return (
    <div className="w-full">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-forest">
        Today&apos;s scam pattern
      </div>
      <h2 className="display mt-1 text-[24px] font-bold leading-tight text-indigo">
        {familyLabel}
      </h2>
      <p className="mt-2 text-[13px] leading-snug text-fg-soft">
        {familyDescription}
      </p>
      {body && (
        <div className="mt-4 rounded-2xl bg-aubergine-tint/60 p-3.5">
          {meta && (
            <div className="text-[11px] font-semibold text-aubergine">
              {meta}
            </div>
          )}
          <p className="mt-1 text-[13px] leading-snug text-indigo">{body}</p>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-canvas-warm/70 p-3.5">
        <div className="flex items-center gap-2.5">
          {SCAM_MOLES.map((src) => (
            <span
              key={src}
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1C133D]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-11 w-11" />
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] font-medium leading-snug text-indigo">
          Whack the {familyLabel.toLowerCase()} moles in any of these three
          disguises. Leave the real ones.
        </p>
      </div>

      <button
        type="button"
        onClick={onReady}
        disabled={isStarting}
        className="mt-5 flex w-full items-center justify-between rounded-full bg-mint py-3 pl-5 pr-2 text-[14px] font-bold text-indigo transition hover:brightness-105 disabled:opacity-60"
      >
        {isStarting ? "Starting…" : ctaLabel}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint">
          {isStarting ? (
            <Loader2 size={15} strokeWidth={2.6} className="animate-spin" />
          ) : (
            <div className="bg-indigo p-2 rounded-full">
              <Play size={14} strokeWidth={2.8} className="fill-paper" />
            </div>
          )}
        </span>
      </button>
    </div>
  );
}
