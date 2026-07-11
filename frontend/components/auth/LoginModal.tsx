"use client";

import { useEffect } from "react";
import { useConnection } from "wagmi";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoopSigil } from "@/components/home/motifs";
import { LoginButtons } from "./LoginButtons";

/**
 * Onward-branded login modal. SIWE + redirect is handled by SiweGate (mounted
 * in Providers), so this modal only renders the connection buttons and closes
 * itself once authenticated.
 */
export function LoginModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isConnected } = useConnection();
  const { status } = useSession();

  useEffect(() => {
    if (isConnected && status === "authenticated") {
      onOpenChange(false);
    }
  }, [isConnected, status, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-[24px] bg-paper border-none p-6">
        <DialogHeader className="items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-indigo">
            <LoopSigil size={26} color="var(--color-mustard)" />
          </div>
          <DialogTitle className="display text-[24px] font-bold text-indigo">
            Welcome to Onward
          </DialogTitle>
          <DialogDescription className="text-[13px] text-fg-soft">
            Sign in with email or Google. We&apos;ll set up your wallet
            automatically, no downloads needed.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <LoginButtons />
        </div>

        <p className="mt-4 text-center text-[10px] text-fg-soft/70 leading-relaxed">
          Your wallet is yours. You can export it to another wallet anytime from
          settings.
        </p>
      </DialogContent>
    </Dialog>
  );
}