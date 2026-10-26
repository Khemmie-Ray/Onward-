"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Squash as Hamburger } from "hamburger-react";
import { X } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { HOME_ROUTE } from "@/lib/nav/routes";
import { getRightPanel, RightPanelContent } from "./RightPanel";

export function MobileShellBar() {
  const pathname = usePathname();
  const hasPanel = Boolean(getRightPanel(pathname));

  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

 
  useEffect(() => setOpen(false), [pathname]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-fg-soft/10 bg-paper/85 px-5 py-4 backdrop-blur-md">
        <Link href={HOME_ROUTE} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-indigo">
            <LoopSigil size={20} color="var(--color-mustard)" />
          </div>
          <span className="display text-[22px] font-semibold text-indigo">
            onward
          </span>
        </Link>

        {hasPanel && (
          <div className="-mr-2">
            <Hamburger
              toggled={open}
              toggle={setOpen}
              size={22}
              color="var(--color-indigo)"
              rounded
              label="Toggle page panel"
              duration={0.3}
            />
          </div>
        )}
      </header>

      {mounted &&
        hasPanel &&
        createPortal(
          <>
            <div
              aria-hidden
              onClick={close}
              className={`fixed inset-0 z-40 bg-indigo/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Page panel"
              className={`fixed right-0 top-0 z-50 flex h-dvh w-full flex-col bg-canvas transition-transform duration-300 ease-out md:hidden ${
                open
                  ? "translate-x-0 shadow-[-8px_0_32px_rgba(31,58,110,0.15)]"
                  : "pointer-events-none translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-shadow/40 px-4 py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-soft">
                  This page
                </span>
                <button
                  onClick={close}
                  aria-label="Close panel"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-soft transition-colors hover:bg-canvas-warm hover:text-indigo"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {hasOpened && <RightPanelContent />}
              </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
