"use client";

import { useState, useCallback } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useWeb3Auth } from "@web3auth/modal/react";

export function WalletDetails({ onBack }: { onBack: () => void }) {
  const { connection, isConnected, status } = useWeb3Auth();

  const [stage, setStage] = useState<"warning" | "revealed">("warning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const wipeAndBack = useCallback(() => {
    setPrivateKey(null);
    setShown(false);
    setCopied(false);
    setError(null);
    onBack();
  }, [onBack]);

  const reveal = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = connection?.ethereumProvider ?? null;
      if (!isConnected || !provider) {
        console.error(
          `[key export] connection not ready (status: ${status ?? "unknown"}, connected: ${isConnected}, hasConnection: ${!!connection})`,
        );
        setError(
          "Wallet not ready. Please make sure you're signed in, then try again.",
        );
        return;
      }
    
      const key = (await provider.request({
        method: "private_key",
      })) as string;

      if (!key) {
        setError("Could not retrieve your key. Please try again.");
        return;
      }
      setPrivateKey(key.startsWith("0x") ? key : `0x${key}`);
      setStage("revealed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[key export] failed:", msg);
      const isExternalWallet = /not been authorized|not authorized/i.test(msg);
      setError(
        isExternalWallet
          ? "You're using your own connected wallet, so your key stays in that wallet. Key export is only for wallets created with Onward."
          : "Key export isn't available right now. If this keeps happening, contact support.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!privateKey) return;
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === privateKey) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // clipboard read can be blocked; nothing to do
        }
      }, 30_000);
    } catch {
      setError("Couldn't copy. Select the key and copy it manually.");
    }
  };

  if (stage === "warning") {
    return (
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
        <BackRow onBack={wipeAndBack} label="Wallet & keys" />

        <div className="mt-2 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-tint">
            <AlertTriangle
              size={26}
              strokeWidth={2.5}
              className="text-terracotta"
            />
          </div>
          <h2 className="display text-[22px] font-bold text-indigo mb-2">
            Your private key is your wallet
          </h2>
          <p className="text-[13px] leading-relaxed text-fg-soft mb-5">
            This key gives complete control of your wallet and everything in it.
            Read this before you continue.
          </p>
        </div>

        <div className="space-y-3">
          <WarnRow text="Anyone who has your key owns your wallet. There is no undo." />
          <WarnRow text="Onward can never see it or recover it for you." />
          <WarnRow text="Never share it, never type it into any website, and never send it to anyone who asks, even if they say they're support." />
          <WarnRow text="Only use it to import your wallet into an app you trust, like MetaMask." />
          <WarnRow text="This only works for wallets created with Onward (email or social sign-in). If you connected your own wallet like MetaMask, you already hold your key in that wallet." />
        </div>

        {error && (
          <p className="mt-4 text-center text-[12px] font-semibold text-terracotta">
            {error}
          </p>
        )}

        <div className="mt-auto pt-6">
          <button
            onClick={reveal}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo py-3.5 text-[13px] font-bold text-cream transition hover:bg-indigo/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" strokeWidth={2.8} />
                Preparing…
              </>
            ) : (
              <>
                <KeyRound size={15} strokeWidth={2.8} />I understand, show my
                key
              </>
            )}
          </button>
          <button
            onClick={wipeAndBack}
            className="mt-2 w-full py-2.5 text-[12.5px] font-semibold text-fg-soft hover:text-indigo"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
      <BackRow onBack={wipeAndBack} label="Your private key" />

      <p className="mb-3 mt-2 text-[12.5px] leading-relaxed text-fg-soft">
        Copy this into MetaMask to import your wallet. Keep it somewhere only
        you can reach. Don&apos;t take a screenshot on a shared phone.
      </p>

      <div className="rounded-xl border border-terracotta/30 bg-canvas-warm p-4">
        <div
          className={`break-all font-mono text-[13px] leading-relaxed text-indigo ${
            shown ? "" : "select-none blur-sm"
          }`}
        >
          {privateKey}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShown((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-canvas-warm py-3 text-[12.5px] font-bold text-indigo transition hover:bg-canvas-warm/70"
        >
          {shown ? (
            <>
              <EyeOff size={15} strokeWidth={2.5} /> Hide
            </>
          ) : (
            <>
              <Eye size={15} strokeWidth={2.5} /> Reveal
            </>
          )}
        </button>
        <button
          onClick={copyKey}
          disabled={!shown}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo py-3 text-[12.5px] font-bold text-cream transition hover:bg-indigo/90 disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check size={15} strokeWidth={2.8} /> Copied
            </>
          ) : (
            <>
              <Copy size={15} strokeWidth={2.5} /> Copy
            </>
          )}
        </button>
      </div>

      {!shown && (
        <p className="mt-2 text-center text-[11px] text-fg-soft">
          Tap Reveal to view, then Copy.
        </p>
      )}
      {copied && (
        <p className="mt-2 text-center text-[11px] text-forest">
          Copied. Your clipboard clears itself shortly for safety.
        </p>
      )}
      {error && (
        <p className="mt-2 text-center text-[11px] font-semibold text-terracotta">
          {error}
        </p>
      )}

      <button
        onClick={wipeAndBack}
        className="mt-auto w-full rounded-xl border border-shadow/50 py-3 text-[12.5px] font-bold text-indigo transition hover:bg-canvas-warm"
      >
        Done
      </button>
    </div>
  );
}

function BackRow({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="mb-2 flex items-center justify-between border-b border-shadow/60 my-4 pb-4">
      <button
        onClick={onBack}
        className="text-[12px] font-semibold text-fg-soft hover:text-indigo"
      >
        &larr; Back
      </button>
      <span className="text-[10px] font-bold uppercase tracking-wider text-fg-soft">
        {label}
      </span>
    </div>
  );
}

function WarnRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-canvas-warm px-3.5 py-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
      <span className="text-[12.5px] leading-snug text-indigo">{text}</span>
    </div>
  );
}
