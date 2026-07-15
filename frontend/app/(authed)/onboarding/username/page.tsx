"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AVATARS } from "@/constants/avatars";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import AvatarTile from "@/components/dashboard/onboarding/AvatarTile";
import {
  AvailabilityIcon,
  AvailabilityMessage,
} from "@/components/dashboard/onboarding/Avalability";
import { useOnwardLogout } from "@/hooks/useOnwardLogout";
import { LogOut } from "lucide-react";

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
      // Invalidate the status query so AuthGuard picks up the change
      await queryClient.refetchQueries({ queryKey: ["me", "status"] });
      router.replace("/overview");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <button
        onClick={handleDisconnect}
        className="p-6 text-red-500 flex justify-end cursor-pointer w-full"
      >
        <LogOut size={28} />
      </button>
      <div className="flex flex-col items-center justify-center px-4 py-10 w-full">
        <div className="w-full lg:w-[30%] md:w-[30%]">
          <div className="text-center mb-8">
            <h1 className="display text-[36px] font-bold text-indigo leading-tight">
              Welcome to Onward
            </h1>
            <p className="text-fg-soft mt-2">
              Pick a name and avatar — this is how others will see you.
            </p>
          </div>
          <div className="mb-8">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft mb-2">
              Display name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. kate"
                maxLength={20}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-indigo/15 bg-white text-indigo placeholder:text-fg-soft/60 focus:border-indigo outline-none transition"
                autoComplete="off"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AvailabilityIcon state={availability} />
              </div>
            </div>
            <AvailabilityMessage state={availability} />
            <p className="text-xs text-fg-soft mt-2">
              2–20 characters · letters, numbers, _ or -
            </p>
          </div>
          <div className="mb-8">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-fg-soft mb-2">
              Pick your avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
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
            <div className="mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-xl bg-indigo text-white font-bold text-base disabled:bg-indigo/40 disabled:cursor-not-allowed hover:bg-indigo/90 transition"
          >
            {submitting ? "Saving…" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
