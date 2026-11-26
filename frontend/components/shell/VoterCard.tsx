// frontend/components/shell/VoterCard.tsx
"use client";

import { useState, type ReactNode } from "react";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { ChevronUp, ExternalLink, Loader2, Vote } from "lucide-react";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { useFlowVote } from "@/hooks/useFlowVote";
import { FLOW_URL, flowAllocation } from "@/lib/onchain/flowstate";

export function VoteCard() {
  const { isVerified, isLoading } = useIdentityContext();
  const { address } = useConnection();
  const [open, setOpen] = useState(false);

  if (isLoading || !isVerified || !address) return null;

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
          className="mt-4 animate-fade-up border-t border-canvas-warm pt-4"
        >
          {/* key resets every step if the wallet changes */}
          <Ballot key={address} address={address as Address} />
        </div>
      )}
    </div>
  );
}

function Ballot({ address }: { address: Address }) {
  const vote = useFlowVote(address);
  const s = vote.snapshot;
  const allocation = s ? flowAllocation(s) : null;
  const disabled = Boolean(vote.busy);
  const tx = vote.confirmed ?? vote.pending;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] leading-relaxed text-fg-soft">
        Verified GoodDollar members decide how G$ funding is shared between
        GoodBuilders projects. Your vote helps keep Onward free to learn on.
      </p>

      {vote.busy && (
        <p
          role="status"
          className="flex items-center gap-2 text-[12px] font-semibold text-indigo"
        >
          <Loader2 size={13} className="animate-spin" />
          {vote.busy}
        </p>
      )}
      {vote.error && (
        <p role="alert" className="rounded-xl bg-terracotta-tint px-3 py-2 text-[12px] text-terracotta">
          {vote.error}
        </p>
      )}
      {vote.notice && (
        <p role="status" className="rounded-xl bg-forest-tint px-3 py-2 text-[12px] text-forest">
          {vote.notice}
        </p>
      )}

      {!s ? (
        !vote.busy && (
          <SecondaryButton onClick={vote.refresh} disabled={disabled}>
            Try again
          </SecondaryButton>
        )
      ) : !s.verified ? (
        <>
          <p className="text-[12px] text-indigo">
            We couldn&apos;t confirm your GoodID verification yet.
          </p>
          <SecondaryButton onClick={vote.refresh} disabled={disabled}>
            I&apos;ve verified, check again
          </SecondaryButton>
        </>
      ) : !s.recipientActive ? (
        <p className="text-[12px] text-indigo">
          Onward isn&apos;t open for votes right now. Check back soon.
        </p>
      ) : s.votingPower === 0n ? (
        <>
          <p className="text-[12px] text-indigo">
            First, claim your voting rights. It&apos;s a free signature, no fee.
          </p>
          <PrimaryButton onClick={vote.claim} disabled={disabled}>
            Claim voting rights
          </PrimaryButton>
        </>
      ) : vote.review ? (
        <>
          <p className="text-[12px] leading-snug text-indigo">
            Give Onward <strong>{vote.review.amount}</strong> votes
            {allocation && allocation.current > 0n
              ? ` (currently ${String(allocation.current)})`
              : ""}
            . Your votes for other projects stay the same.
          </p>
          <p className="text-[11.5px] text-fg-soft">
            Network fee: about {Number(vote.review.fee).toFixed(5)} CELO
          </p>
          <div className="flex gap-2">
            <SecondaryButton onClick={vote.cancelReview} disabled={disabled}>
              Back
            </SecondaryButton>
            <PrimaryButton onClick={vote.submit} disabled={disabled}>
              Confirm vote
            </PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-indigo">
              Votes for Onward (up to {String(allocation?.maximum ?? 0n)})
            </span>
            <input
              inputMode="numeric"
              value={vote.amount}
              onChange={(e) => vote.setAmount(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border-2 border-indigo/15 bg-paper px-3 py-2 text-[13px] font-semibold text-indigo outline-none focus:border-indigo"
            />
          </label>
          <PrimaryButton
            onClick={vote.prepare}
            disabled={disabled || !vote.amount}
          >
            Review vote
          </PrimaryButton>
        </>
      )}

      {tx && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <a
            href={`https://celoscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-indigo underline underline-offset-2"
          >
            View transaction
            <ExternalLink size={11} />
          </a>
          {vote.pending && (
            <button
              type="button"
              onClick={vote.checkPending}
              disabled={disabled}
              className="font-semibold text-indigo underline underline-offset-2 disabled:opacity-50"
            >
              Check status
            </button>
          )}
        </div>
      )}

      <a
        href={FLOW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-fg-soft underline underline-offset-2"
      >
        See all GoodBuilders projects on Flow State
        <ExternalLink size={10} />
      </a>
    </div>
  );
}

type ButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
};

function PrimaryButton({ onClick, disabled, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center rounded-xl bg-indigo px-4 py-2.5 text-[12.5px] font-bold text-paper transition hover:bg-indigo/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, disabled, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center rounded-xl border-2 border-indigo/15 bg-white px-4 py-2 text-[12.5px] font-bold text-indigo transition hover:border-indigo/30 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}