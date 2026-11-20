"use client";

import { useState } from "react";
import { useWeb3AuthConnect, useWeb3Auth } from "@web3auth/modal/react";
import { Loader2, Wallet, ArrowRight } from "lucide-react";
import { WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";

type Method = "google" | "email" | "wallet" | null;

export function LoginButtons() {
  const { connectTo, loading: connecting, error } = useWeb3AuthConnect();
  const { isInitialized } = useWeb3Auth();

  const [activeMethod, setActiveMethod] = useState<Method>(null);
  const [email, setEmail] = useState("");

  const anyBusy = !isInitialized || connecting;

  const loginWithGoogle = async () => {
    if (anyBusy) return;
    setActiveMethod("google");
    try {
      await connectTo(WALLET_CONNECTORS.AUTH, {
        authConnection: AUTH_CONNECTION.GOOGLE,
      });
    } catch (e) {
      console.error("[google connect]", e);
      setActiveMethod(null);
    }
  };

  const loginWithEmail = async () => {
    if (anyBusy || !email.trim()) return;
    setActiveMethod("email");
    try {
      await connectTo(WALLET_CONNECTORS.AUTH, {
        authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
        loginHint: email.trim(),
      });
    } catch (e) {
      console.error("[email connect]", e);
      setActiveMethod(null);
    }
  };

  const loginWithWallet = async () => {
    if (anyBusy) return;
    setActiveMethod("wallet");
    try {
      await connectTo(WALLET_CONNECTORS.METAMASK);
    } catch (e) {
      console.error("[wallet connect]", e);
      setActiveMethod(null);
    }
  };

  const googleLoading = activeMethod === "google";
  const emailLoading = activeMethod === "email";
  const walletLoading = activeMethod === "wallet";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Google */}
      <button
        onClick={loginWithGoogle}
        disabled={anyBusy}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo/15 bg-white py-4 font-semibold text-indigo transition hover:border-indigo/30 active:scale-[0.99] disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-indigo/10" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
          or use your email
        </span>
        <div className="h-px flex-1 bg-indigo/10" />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="login-email"
          className="text-[13px] font-bold text-indigo"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loginWithEmail()}
          placeholder="you@email.com"
          disabled={anyBusy}
          className="w-full rounded-2xl border-2 border-indigo/15 bg-white px-4 py-3.5 text-indigo outline-none transition placeholder:text-fg-soft/60 focus:border-indigo disabled:opacity-50"
        />
        <button
          onClick={loginWithEmail}
          disabled={anyBusy || !email.trim()}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo py-4 font-semibold text-cream transition hover:bg-indigo/90 active:scale-[0.99] disabled:opacity-40"
        >
          {emailLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Continue with email <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-indigo/10" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
          or connect a wallet
        </span>
        <div className="h-px flex-1 bg-indigo/10" />
      </div>
      {/* wallet */}
      <button
        onClick={loginWithWallet}
        disabled={anyBusy}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#77C082] py-4 font-bold text-[#1B133B] shadow-[0_10px_28px_-10px_rgba(119,192,130,0.7)] transition duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
      >
        {walletLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Wallet size={18} strokeWidth={2.5} />
        )}
        Metamask
      </button>

      {error && (
        <p className="text-center text-[11px] text-terracotta">
          {error.message}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
