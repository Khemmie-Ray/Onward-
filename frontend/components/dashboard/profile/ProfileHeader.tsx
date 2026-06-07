import React from "react";
import { Award } from "lucide-react";
import { SunMotif } from "@/components/home/motifs";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface ProfileHeaderProps {
  displayName: string;
  avatarId: string | null;
  walletAddress: string;
  daysOnOnward: number;
}

const ProfileHeader = ({
  displayName,
  avatarId,
  walletAddress,
  daysOnOnward,
}: ProfileHeaderProps) => {
  const truncatedAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  return (
    <section className="mb-10 animate-[fade-up_0.8s_0.05s_ease_both]">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-mustard"
            style={{ animation: "spin 30s linear infinite" }}
          >
            <SunMotif size={110} rays={10} />
          </div>
          <div className="relative shadow-[0_8px_20px_rgba(199,93,63,0.30)] rounded-full">
            <UserAvatar
              avatarId={avatarId}
              size={80}
              priority
              className="border-2 border-paper"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta mb-2">
            <Award size={13} strokeWidth={2.5} />
            Your profile
          </div>
          <h1 className="display text-[36px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.025em] text-indigo">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-fg-soft">
            <span className="font-mono">{truncatedAddress}</span>
            <span className="text-fg-faint">·</span>
            <span>
              Joined {daysOnOnward} day{daysOnOnward === 1 ? "" : "s"} ago
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;