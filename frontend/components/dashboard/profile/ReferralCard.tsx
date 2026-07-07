"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Users } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type ReferralData = {
  referral_code: string | null;
  total_referred: number;
  qualified_referrals: number;
  referral_points_earned: number;
};

export function ReferralCard() {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/referral");
        if (!res.ok) return;
        const json = (await res.json()) as ReferralData;
        if (!cancelled) setData(json);
      } catch {
        // silent — card just won't render its data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (!data?.referral_code) return null;

  const referralLink = `https://onwardlearn.app/?ref=${data.referral_code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-[18px] bg-aubergine p-6 shadow-[0_8px_24px_rgba(91,46,92,0.20)] w-full">
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={16} strokeWidth={2.5} className="text-mustard" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard">
            Invite and earn
          </span>
        </div>
        <h3 className="display text-[20px] font-bold text-paper mb-1">
          Earn 250 points per friend
        </h3>
        <p className="text-[12.5px] text-paper/75 leading-relaxed mb-4">
          Share your link. When a friend joins, verifies, and completes their
          first activity, you earn 250 points.
        </p>

        <div className="flex items-center gap-2 bg-paper/10 rounded-xl p-2 mb-4">
          <div className="flex-1 min-w-0 px-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/50 mb-0.5">
              Your link
            </div>
            <div className="text-[12px] font-semibold text-paper truncate">
              onwardlearn.app/?ref={data.referral_code}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-mustard px-3 py-2 text-[12px] font-bold text-indigo hover:bg-mustard/90 transition shrink-0"
          >
            {copied ? (
              <Check size={13} strokeWidth={2.8} />
            ) : (
              <Copy size={13} strokeWidth={2.5} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-paper/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={12} strokeWidth={2.5} className="text-paper/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-paper/60">
                Referred
              </span>
            </div>
            <div className="display text-[22px] font-bold text-paper tabular-nums leading-none">
              {data.total_referred}
            </div>
          </div>
          <div className="flex-1 bg-paper/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gift size={12} strokeWidth={2.5} className="text-mustard" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-paper/60">
                Points earned
              </span>
            </div>
            <div className="display text-[22px] font-bold text-mustard tabular-nums leading-none">
              {data.referral_points_earned.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
