"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Copy, LogOut, User as UserIcon, Check } from "lucide-react";

export function WalletPill({
  address,
  onDisconnect,
}: {
  address: string;
  onDisconnect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayString = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const avatarInitial = address.slice(2, 3).toUpperCase();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-paper py-1.5 pl-1.5 pr-3 shadow-[0_4px_12px_rgba(31,58,110,0.06)] transition-all hover:shadow-[0_6px_16px_rgba(31,58,110,0.10)]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-[12px] font-bold text-paper">
          {avatarInitial}
        </div>
        <span className="text-[12px] font-semibold text-indigo">
          {displayString}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-fg-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-[14px] bg-paper p-2 shadow-[0_12px_32px_rgba(31,58,110,0.15)] z-50 animate-[fade-up_0.2s_ease_both]">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-indigo hover:bg-canvas-warm"
          >
            {copied ? (
              <Check size={14} strokeWidth={2.5} className="text-forest" />
            ) : (
              <Copy size={14} strokeWidth={2.5} />
            )}
            {copied ? "Copied" : "Copy address"}
          </button>
          <Link
            href="/me"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-indigo hover:bg-canvas-warm"
          >
            <UserIcon size={14} strokeWidth={2.5} />
            Profile
          </Link>
          <div className="h-px bg-shadow my-1" />
          <button
            onClick={() => {
              onDisconnect();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-terracotta hover:bg-terracotta-tint"
          >
            <LogOut size={14} strokeWidth={2.5} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
