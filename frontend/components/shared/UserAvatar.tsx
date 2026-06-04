"use client";

import Image from "next/image";
import { getAvatar } from "@/constants/avatars";

type UserAvatarProps = {
  avatarId: string | null | undefined;
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Single source of truth for rendering a user's avatar.
 *
 * Use everywhere a user's identity is shown — Header, profile, leaderboard,
 * badge cards. Resolves the avatar by id; falls back to default if missing.
 *
 * Renders as a perfect circle by default. Pass className to override the
 * shape (e.g. rounded-2xl for square-ish display on profile pages).
 */
export function UserAvatar({
  avatarId,
  size = 40,
  className = "",
  priority = false,
}: UserAvatarProps) {
  const avatar = getAvatar(avatarId);
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-cream-light shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatar.src}
        alt={avatar.label}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}