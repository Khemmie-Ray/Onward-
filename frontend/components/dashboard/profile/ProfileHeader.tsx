"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { LoopSigil } from "@/components/home/motifs";

interface ProfileHeaderProps {
  displayName: string;
  avatarId: string | null;
  walletAddress: string;
  daysOnOnward: number;
  level: number;
  flagshipLabel: string;
}

const ProfileHeader = ({
  displayName,
  avatarId,
  walletAddress,
  daysOnOnward,
  level,
  flagshipLabel,
}: ProfileHeaderProps) => {
  const truncated = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, denied permission). Nothing
      // to recover; the address stays visible for manual copy.
    }
  };

  return (
    <section className="mb-7 animate-[fade-up_0.8s_0.05s_ease_both]">
      <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#271d4e_0%,#3a2a6b_55%,#48307a_100%)] px-5 py-6 sm:px-8 sm:py-7">
        <LoopSigil
          size={190}
          color="var(--color-cream)"
          className="pointer-events-none absolute -right-8 -top-10 opacity-[0.06]"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar
            avatarId={avatarId}
            size={76}
            priority
            className="ring-4 ring-cream/15"
          />

          <div className="min-w-0 flex-1">
            <h1 className="display truncate text-[26px] font-bold leading-tight text-cream sm:text-[30px]">
              {displayName}
            </h1>
            <p className="mt-0.5 text-[13px] text-cream/70">
              On Onward for {daysOnOnward} day{daysOnOnward === 1 ? "" : "s"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-forest/80 px-2.5 py-1 text-[11px] font-bold text-cream">
                Level {level}
              </span>
              <span className="rounded-full bg-mustard/25 px-2.5 py-1 text-[11px] font-bold text-cream">
                {flagshipLabel}
              </span>
              <button
                onClick={copy}
                aria-label="Copy wallet address"
                className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-2.5 py-1 text-[11px] font-semibold text-cream/80 transition hover:bg-cream/20"
              >
                <span className="font-mono">{truncated}</span>
                {copied ? (
                  <Check size={12} strokeWidth={2.5} className="text-forest" />
                ) : (
                  <Copy size={12} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
