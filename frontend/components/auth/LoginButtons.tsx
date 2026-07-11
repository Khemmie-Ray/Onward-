"use client";

import { useEffect, useRef, useState } from "react";
import { useWeb3AuthConnect, useWeb3Auth } from "@web3auth/modal/react";
import { Mail, Loader2, Wallet } from "lucide-react";
import { WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";
// import { useConnection } from "wagmi";
// import { useSession } from "next-auth/react";
// import { useSiweAuth } from "@/hooks/useSiweAuth";

type Method = "google" | "email" | "wallet" | null;

export function LoginButtons() {
  const { connectTo, loading: connecting, error } = useWeb3AuthConnect();
  const { isInitialized } = useWeb3Auth();
  // const { isConnected, address } = useConnection();
  // const { status } = useSession();
  // const { signInWithEthereum } = useSiweAuth();

  const [signing, setSigning] = useState(false);
  const [activeMethod, setActiveMethod] = useState<Method>(null);
  const [email, setEmail] = useState("");
  // const siweAttempted = useRef(false);

  console.log(WALLET_CONNECTORS, AUTH_CONNECTION)

  // useEffect(() => {
  //   if (
  //     isConnected &&
  //     address &&
  //     status === "unauthenticated" &&
  //     !siweAttempted.current
  //   ) {
  //     siweAttempted.current = true;
  //     setSigning(true);
  //     signInWithEthereum()
  //       .then((ok) => {
  //         if (ok) onSignedIn?.();
  //       })
  //       .catch((e) => {
  //         console.error("[SIWE failed]", e);
  //         siweAttempted.current = false;
  //       })
  //       .finally(() => {
  //         setSigning(false);
  //         setActiveMethod(null);
  //       });
  //   }
  // }, [isConnected, address, status, signInWithEthereum, onSignedIn]);

  const anyBusy = !isInitialized || connecting || signing;

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
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={loginWithGoogle}
        disabled={anyBusy}
        className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-indigo/15 bg-white py-3.5 font-semibold text-indigo hover:border-indigo/30 transition disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          disabled={anyBusy}
          className="w-full px-4 py-3 rounded-xl border-2 border-indigo/15 bg-white text-indigo placeholder:text-fg-soft/60 focus:border-indigo outline-none transition disabled:opacity-50"
        />
        <button
          onClick={loginWithEmail}
          disabled={anyBusy || !email.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo py-3.5 font-semibold text-cream hover:bg-indigo/90 transition disabled:opacity-40"
        >
          {emailLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Mail size={18} strokeWidth={2.5} />
          )}
          Continue with email
        </button>
      </div>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-indigo/10" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
          or connect a wallet
        </span>
        <div className="flex-1 h-px bg-indigo/10" />
      </div>

      <button
        onClick={loginWithWallet}
        disabled={anyBusy}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-indigo/15 bg-white py-3.5 font-semibold text-indigo hover:border-indigo/30 transition disabled:opacity-50"
      >
        {walletLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Wallet size={18} strokeWidth={2.5} />
        )}
        Metamask
      </button>
{/* 
      {!isInitialized && (
        <p className="text-center text-[11px] text-fg-soft">
          Getting things ready…
        </p>
      )}
      {signing && (
        <p className="text-center text-[11px] text-fg-soft">
          Confirm the signature to finish signing in…
        </p>
      )} */}
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
    <svg width="18" height="18" viewBox="0 0 24 24">
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
