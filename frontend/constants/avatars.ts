/**
 * Avatar options shown on the onboarding form and rendered everywhere
 * a user's identity appears (Header, profile, leaderboard, badge cards).
 *
 * PNG files live at /public/avatars/avatar-1.png ... avatar-12.png.
 *
 * `label` is for accessibility (screen reader) and not displayed visually.
 * `category` lets us group/segment if we add filtering later — not used in v1.
 */

export type AvatarCategory = "female" | "male" | "anonymous";

export type AvatarOption = {
  id: string;
  src: string;
  label: string;
  category: AvatarCategory;
};

export const AVATARS: AvatarOption[] = [
  // ─── Female-presenting ──────────────────────────────────
  { id: "avatar-1",  src: "/avatars/avatar-1.png",  label: "Avatar 1",  category: "female" },
  { id: "avatar-2",  src: "/avatars/avatar-2.png",  label: "Avatar 2",  category: "anonymous" },
  { id: "avatar-3",  src: "/avatars/avatar-3.png",  label: "Avatar 3",  category: "female" },
  { id: "avatar-4",  src: "/avatars/avatar-4.png",  label: "Avatar 4",  category: "female" },
  { id: "avatar-5",  src: "/avatars/avatar-5.png",  label: "Avatar 5",  category: "female" },

  // ─── Male-presenting ────────────────────────────────────
  { id: "avatar-6",  src: "/avatars/avatar-6.png",  label: "Avatar 6",  category: "male" },
  { id: "avatar-7",  src: "/avatars/avatar-7.png",  label: "Avatar 7",  category: "female" },
  { id: "avatar-8",  src: "/avatars/avatar-8.png",  label: "Avatar 8",  category: "anonymous" },
  { id: "avatar-9",  src: "/avatars/avatar-9.png",  label: "Avatar 9",  category: "male" },
  { id: "avatar-10", src: "/avatars/avatar-10.png", label: "Avatar 10", category: "male" },

  // ─── Anonymous / prefer not to say ──────────────────────
  { id: "avatar-11", src: "/avatars/avatar-11.png", label: "Avatar 11",  category: "male" },
  { id: "avatar-12", src: "/avatars/avatar-12.png", label: "Avatar 12", category: "male" },
];

export const DEFAULT_AVATAR_ID = "avatar-12";

/**
 * Look up an avatar by id. Returns the default if not found.
 */
export function getAvatar(id: string | null | undefined): AvatarOption {
  if (!id) return AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID)!;
  return AVATARS.find((a) => a.id === id) ?? AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID)!;
}

export function isValidAvatarId(id: string | undefined | null): id is string {
  if (!id) return false;
  return AVATARS.some((a) => a.id === id);
}
