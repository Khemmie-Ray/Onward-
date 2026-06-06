import React from "react";
import Image from "next/image";
import { type AvatarOption } from "@/constants/avatars";
import { Check } from "lucide-react";

const AvatarTile = ({
  avatar,
  selected,
  onSelect,
}: {
  avatar: AvatarOption;
  selected: boolean;
  onSelect: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select ${avatar.label}`}
      aria-pressed={selected}
      className={`relative aspect-square rounded-2xl overflow-hidden bg-white transition ring-offset-2 ring-offset-cream ${
        selected
          ? "ring-3 ring-indigo scale-[1.03]"
          : "ring-1 ring-indigo/15 hover:ring-indigo/40"
      }`}
    >
      <Image
        src={avatar.src}
        alt={avatar.label}
        fill
        sizes="(max-width: 480px) 25vw, 110px"
        className="object-cover"
      />
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo flex items-center justify-center">
          <Check size={12} className="text-cream" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

export default AvatarTile;
