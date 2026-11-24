"use client";

import { useState } from "react";
import { ChevronUp, ExternalLink, Vote } from "lucide-react";
import { useWeb3Auth } from "@web3auth/modal/react";
import { WALLET_CONNECTORS } from "@web3auth/modal";
import { useIdentityContext } from "@/contexts/IdentityContext";

const FLOW_STATE_URL =
  "https://flowstate.network/flow-councils/42220/0x889e0aadaa3f8b28a794ef70da147827c620a590";

const STEPS = [
  "Open Flow State and connect the wallet you use on Onward.",
  "Claim your voting rights. It is a free signature.",
  "Give some of your votes to Onward and confirm. This needs a little CELO for the network fee.",
];

export function VoteCard() {
  const { isVerified, isLoading } = useIdentityContext();
  const { web3Auth } = useWeb3Auth();
  const [open, setOpen] = useState(false);

  const usesOwnWallet =
    web3Auth?.primaryConnectorName != null &&
    web3Auth.primaryConnectorName !== WALLET_CONNECTORS.AUTH;

  if (isLoading || !isVerified || !usesOwnWallet) return null;

  return (
    <div className="mb-3 w-full rounded-2xl border-2 border-indigo/10 bg-white p-4 shadow-[0_4px_14px_rgba(31,58,110,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mustard-tint text-indigo">
          <Vote size={18} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold leading-tight text-indigo">
            Vote for Onward
          </p>
          <p className="mt-0.5 text-[11.5px] text-fg-soft">
            GoodBuilders · free to vote
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="vote-card-details"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo px-3.5 py-2 text-[11.5px] font-bold text-paper transition hover:bg-indigo/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          {open ? (
            <>
              Close
              <ChevronUp size={12} strokeWidth={2.8} />
            </>
          ) : (
            "Vote"
          )}
        </button>
      </div>

      {open && (
        <div
          id="vote-card-details"
          className="mt-4 border-t border-canvas-warm pt-4 animate-fade-up"
        >
          <p className="text-[12.5px] leading-relaxed text-fg-soft">
            Onward is part of GoodBuilders, where verified GoodDollar members
            decide how G$ funding is shared between projects. Your vote helps
            keep Onward free to learn on.
          </p>

          <ol className="mt-3 flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo text-[10.5px] font-bold text-paper">
                  {i + 1}
                </span>
                <span className="text-[12px] leading-snug text-indigo">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <a
            href={FLOW_STATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo px-4 py-3 text-[13px] font-bold text-paper transition hover:bg-indigo/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            Open Flow State
            <ExternalLink size={13} strokeWidth={2.6} />
          </a>
        </div>
      )}
    </div>
  );
}
