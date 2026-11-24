"use client";

import { HOME_ROUTE } from "@/lib/nav/routes";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { AVATARS } from "@/constants/avatars";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import AvatarTile from "@/components/dashboard/onboarding/AvatarTile";
import {
  AvailabilityIcon,
  AvailabilityMessage,
} from "@/components/dashboard/onboarding/Avalability";
import { useOnwardLogout } from "@/hooks/useOnwardLogout";
import { LogOut, ArrowRight, Target, Star, Flag } from "lucide-react";

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; current?: boolean }
  | { status: "unavailable"; reason: string };

export default function OnboardingUsernamePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();
  const logout = useOnwardLogout();

  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleDisconnect = async () => {
    await logout();
  };

  const checkAvailability = useCallback(
    async (value: string) => {
      if (value.length < 2) {
        setAvailability({ status: "idle" });
        return;
      }
      setAvailability({ status: "checking" });
      try {
        const res = await authFetch(
          `/api/profile/username-available?name=${encodeURIComponent(value)}`,
        );
        const data = (await res.json()) as
          | { available: true; current?: boolean }
          | { available: false; reason: string };
        if (data.available) {
          setAvailability({ status: "available", current: data.current });
        } else {
          setAvailability({ status: "unavailable", reason: data.reason });
        }
      } catch {
        setAvailability({ status: "idle" });
      }
    },
    [authFetch],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (name.trim()) checkAvailability(name.trim());
      else setAvailability({ status: "idle" });
    }, 300);
    return () => clearTimeout(handle);
  }, [name, checkAvailability]);

  const canSubmit =
    availability.status === "available" &&
    selectedAvatar !== null &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await authFetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name.trim(),
          avatar_id: selectedAvatar,
          referral_code:
            typeof window !== "undefined"
              ? localStorage.getItem("onward_ref")
              : null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(err.error ?? "Failed to save");
        setSubmitting(false);
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("onward_ref");
      }
      await queryClient.refetchQueries({ queryKey: ["me", "status"] });
      router.replace(HOME_ROUTE);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const previewName = name.trim() || "your_name";
  const selectedAvatarData = AVATARS.find((a) => a.id === selectedAvatar);

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 pb-8 pt-24 sm:px-10 lg:min-h-0 lg:px-16 lg:py-8">
        <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-fg-soft/10 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-10 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Image
            src="/images/m-logo.png"
            alt="Onward"
            width={125}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <button
            onClick={handleDisconnect}
            className="inline-flex items-center gap-2 rounded-full border border-fg-soft/15 px-4 py-2 text-[14px] font-semibold text-fg-soft transition hover:border-indigo/30 hover:text-indigo"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10 lg:py-0">
          <span className="self-start rounded-full bg-indigo/10 px-3 py-1 text-[12px] font-bold text-indigo">
            One last step
          </span>
          <h1 className="mt-4 text-[clamp(40px,6vw,56px)] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#1B133B]">
            Make it yours<span className="text-[#77C082]">.</span>
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-[#4A4466]">
            Pick a name and a face. It is how you show up on the leaderboard.
          </p>

          <div className="mt-8">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft">
              Display name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="e.g. kate"
                maxLength={20}
                autoComplete="off"
                autoFocus
                className="w-full rounded-xl border-2 border-indigo/15 bg-white px-4 py-3 pr-12 text-indigo outline-none transition placeholder:text-fg-soft/60 focus:border-indigo"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AvailabilityIcon state={availability} />
              </div>
            </div>
            <AvailabilityMessage state={availability} />
            <p className="mt-2 text-xs text-fg-soft">
              2–20 characters · letters, numbers, _ or -
            </p>
          </div>

          <div className="mt-8">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft">
              Pick your avatar
            </label>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {AVATARS.map((avatar) => (
                <AvatarTile
                  key={avatar.id}
                  avatar={avatar}
                  selected={selectedAvatar === avatar.id}
                  onSelect={() => setSelectedAvatar(avatar.id)}
                />
              ))}
            </div>
          </div>

          {submitError && (
            <div className="mt-6 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo py-4 text-base font-bold text-white transition hover:bg-indigo/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo/40"
          >
            {submitting ? (
              "Saving…"
            ) : (
              <>
                Start learning <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
      <aside className="relative hidden flex-col justify-center overflow-hidden bg-[#EDEAFB] p-10 lg:flex">
        <div className="pointer-events-none absolute right-8 top-10 inline-flex items-center gap-2 rounded-full bg-[#D7E9D3] px-3 py-2 text-[13px] font-bold text-[#2E5237] shadow-sm">
          <Target size={15} /> Daily quests
        </div>
        <div className="pointer-events-none absolute bottom-10 left-8 inline-flex items-center gap-2 rounded-full bg-[#F3E2A8] px-3 py-2 text-[13px] font-bold text-[#5A4A17] shadow-sm">
          <Star size={15} /> Earn points
        </div>
        <div className="pointer-events-none absolute bottom-10 right-8 inline-flex items-center gap-2 rounded-full bg-indigo px-3 py-2 text-[13px] font-bold text-white shadow-sm">
          <Flag size={15} /> Milestones
        </div>

        <div className="mx-auto w-full max-w-[520px]">
          <h2 className="text-[clamp(30px,3.4vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1B133B]">
            Here is how others
            <br />
            <span className="text-indigo">will see you.</span>
          </h2>
          <div className="mt-8 rounded-3xl bg-white p-5 shadow-[0_18px_50px_-18px_rgba(27,19,59,0.25)]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-indigo/10">
                {selectedAvatarData && (
                  <img
                    src={selectedAvatarData.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft">
                  Learner
                </p>
                <p className="text-[24px] font-extrabold leading-tight text-[#1B133B]">
                  {previewName}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#F3E2A8] px-2 py-0.5 text-[11px] font-bold text-[#5A4A17]">
                    Day 1
                  </span>
                  <span className="rounded-full bg-indigo/10 px-2 py-0.5 text-[11px] font-bold text-indigo">
                    0 points
                  </span>
                  <span className="rounded-full bg-[#E3DEF8] px-2 py-0.5 text-[11px] font-bold text-indigo">
                    Level 1
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft">
            This week&apos;s leaderboard
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <LbRow
              rank={23}
              name="Tobi"
              pts="140 pts"
              initial="T"
              tone="bg-[#2E5237]"
            />
            <LbRow
              rank={24}
              name="Ada"
              pts="95 pts"
              initial="A"
              tone="bg-[#C06A4E]"
            />
            <div className="flex items-center justify-between rounded-2xl bg-[#1B133B] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-5 text-[13px] font-bold text-[#E8B547]">
                  25
                </span>
                <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                  {selectedAvatarData && (
                    <img
                      src={selectedAvatarData.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="font-semibold text-white">{previewName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#77C082] px-2 py-0.5 text-[11px] font-bold text-[#1B133B]">
                  You
                </span>
                <span className="text-[13px] font-semibold text-white/70">
                  0 pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

function LbRow({
  rank,
  name,
  pts,
  initial,
  tone,
}: {
  rank: number;
  name: string;
  pts: string;
  initial: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-5 text-[13px] font-bold text-fg-soft">{rank}</span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white ${tone}`}
        >
          {initial}
        </div>
        <span className="font-semibold text-[#1B133B]">{name}</span>
      </div>
      <span className="text-[13px] font-semibold text-fg-soft">{pts}</span>
    </div>
  );
}
