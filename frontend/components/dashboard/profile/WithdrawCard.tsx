"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Info,
  Loader2,
  Lock,
  Wallet,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { isAddress, parseUnits, type Address } from "viem";
import { useConnection, useSendTransaction, useWriteContract } from "wagmi";
import { celo } from "wagmi/chains";
import { erc20Abi } from "viem";
import { toast } from "sonner";
import {
  useTokenBalances,
  formatBalance,
  TOKENS,
  type TokenBalance,
} from "@/hooks/useTokenBalances";
import { EXPLORER_BASE } from "@/constants/contracts/address";

type Step = "form" | "review";

const SENDABLE = [
  {
    key: "CELO",
    symbol: "CELO",
    name: "Celo",
    address: null as Address | null,
  },
  {
    key: "G$",
    symbol: TOKENS.gDollar.symbol,
    name: TOKENS.gDollar.name,
    address: TOKENS.gDollar.address,
  },
  {
    key: "USDT",
    symbol: TOKENS.usdt.symbol,
    name: TOKENS.usdt.name,
    address: TOKENS.usdt.address,
  },
] as const;

export function WithdrawCard() {
  return (
    <div className="rounded-[18px] bg-paper p-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
      <WithdrawPanel />
    </div>
  );
}

export function SwapComingSoon() {
  return (
    <div className="rounded-[18px] bg-paper p-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-warm">
          <Lock size={20} strokeWidth={2.5} className="text-fg-soft" />
        </div>
        <h3 className="display text-[20px] font-bold text-indigo mb-1.5">
          Swap is coming soon
        </h3>
        <p className="max-w-70 text-[12.5px] leading-[1.55] text-fg-soft">
          Soon you&apos;ll be able to swap your G$ into USDT right here, so you
          can take your earnings wherever you need them. We&apos;re getting it
          ready.
        </p>
      </div>
    </div>
  );
}

function WithdrawPanel() {
  const { address } = useConnection();
  const { balances } = useTokenBalances(address as Address | undefined);

  const [tokenKey, setTokenKey] =
    useState<(typeof SENDABLE)[number]["key"]>("USDT");
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTx = useSendTransaction();
  const writeTx = useWriteContract();

  const token = SENDABLE.find((t) => t.key === tokenKey)!;
  const balance = balances.find((b) => b.symbol === token.symbol) ?? null;
  const celoBalance = balances.find((b) => b.symbol === "CELO") ?? null;

  const addressValid = isAddress(to.trim());
  const amountNum = Number(amount);
  const amountValid =
    amount !== "" && !Number.isNaN(amountNum) && amountNum > 0;
  const overBalance =
    balance && amountValid ? amountNum > Number(balance.formatted) : false;

  const hasGas = celoBalance ? Number(celoBalance.formatted) > 0 : false;
  const sendingCelo = token.key === "CELO";

  const canReview =
    addressValid && amountValid && !overBalance && (hasGas || sendingCelo);

  const handleMax = () => {
    if (balance) setAmount(balance.formatted);
  };

  const doSend = async () => {
    if (!address || !balance) return;
    setSending(true);
    setError(null);
    const loadingToast = toast.loading(`Sending ${amount} ${token.symbol}…`);
    try {
      const value = parseUnits(amount, balance.decimals);
      let hash: string;

      if (token.address === null) {
        hash = await sendTx.mutateAsync({
          to: to.trim() as Address,
          value,
          chainId: celo.id,
        });
      } else {
        hash = await writeTx.mutateAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [to.trim() as Address, value],
          chainId: celo.id,
        });
      }

      toast.dismiss(loadingToast);
      toast.success(`Sent ${amount} ${token.symbol}`, {
        description: "It should arrive at the address shortly.",
      });

      setTxHash(hash);
      setStep("form");
      setAmount("");
      setTo("");
    } catch (e) {
      toast.dismiss(loadingToast);
      const rejected =
        e instanceof Error && e.message.toLowerCase().includes("reject");
      const msg = rejected
        ? "You rejected the transaction."
        : "The transfer didn't go through. Please try again.";
      setError(msg);
      toast.error(rejected ? "Transaction cancelled" : "Send failed", {
        description: rejected ? undefined : msg,
      });
    } finally {
      setSending(false);
    }
  };

  if (step === "review") {
    return (
      <div>
        <button
          onClick={() => setStep("form")}
          disabled={sending}
          className="mb-4 inline-flex items-center gap-1 text-[12px] font-semibold text-fg-soft hover:text-indigo disabled:opacity-50"
        >
          <ChevronLeft size={14} strokeWidth={2.8} />
          Back
        </button>

        <div className="mb-4 rounded-xl bg-canvas-warm p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-fg-soft">
            Check before you send
          </div>
          <ReviewRow label="Sending" value={`${amount} ${token.symbol}`} />
          <ReviewRow label="To" value={to.trim()} mono />
          <ReviewRow label="Network" value="Celo" />
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta-tint p-3">
          <AlertTriangle
            size={14}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-terracotta"
          />
          <p className="text-[11.5px] leading-snug text-indigo/80">
            This sends on the Celo network and cannot be reversed. Make sure the
            address is correct and can receive on Celo. If you&apos;re unsure,
            send a small amount first.
          </p>
        </div>

        {error && (
          <p className="mb-3 text-center text-[11.5px] font-semibold text-terracotta">
            {error}
          </p>
        )}

        <button
          onClick={doSend}
          disabled={sending}
          className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl bg-indigo py-3.5 text-sm font-bold text-cream transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:bg-indigo/40 lg:w-[60%] md:w-[60%]"
        >
          {sending ? (
            <>
              <Loader2 size={15} strokeWidth={2.8} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send {amount} {token.symbol}
              <ArrowUpRight size={15} strokeWidth={2.8} />
            </>
          )}
        </button>
      </div>
    );
  }
  return (
    <div>
      {txHash && (
        <a
          href={`${EXPLORER_BASE}tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-forest/10 py-2.5 text-[11.5px] font-semibold text-forest transition hover:bg-forest/15"
        >
          Sent. View on the explorer
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
      )}
      <div className="mb-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
          Token
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SENDABLE.map((t) => {
            const b = balances.find((x) => x.symbol === t.symbol);
            const selected = t.key === tokenKey;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTokenKey(t.key);
                  setAmount("");
                }}
                className={`rounded-xl p-3 text-center transition ${
                  selected
                    ? "bg-indigo text-cream"
                    : "bg-canvas-warm text-indigo hover:bg-canvas-warm/70"
                }`}
              >
                <div className="display text-[15px] font-bold leading-none">
                  {t.symbol}
                </div>
                <div className="mt-1 text-[9px] font-semibold opacity-70 tabular-nums">
                  {b ? formatBalance(b.formatted) : "0"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
              Amount
            </span>
            <button
              onClick={handleMax}
              className="text-[11px] font-bold text-mustard hover:opacity-80"
            >
              Max{balance ? ` ${formatBalance(balance.formatted)}` : ""}
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-canvas-warm px-4 py-3.5">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                if (v.split(".").length <= 2) setAmount(v);
              }}
              className="w-full bg-transparent text-[14px] font-bold text-indigo outline-none tabular-nums placeholder:text-fg-soft/40"
            />
            <span className="text-[13px] font-bold text-fg-soft">
              {token.symbol}
            </span>
          </div>
          {overBalance && (
            <p className="mt-1.5 text-[11px] font-semibold text-terracotta">
              More than your {token.symbol} balance.
            </p>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            Send to
          </div>
          <input
            placeholder="0x…"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl bg-canvas-warm px-4 py-3.5 font-mono text-[13px] text-indigo outline-none placeholder:text-fg-soft/40"
          />
          {to.trim() !== "" && !addressValid && (
            <p className="mt-1.5 text-[11px] font-semibold text-terracotta">
              That doesn&apos;t look like a valid address. It should start with
              0x and be 42 characters.
            </p>
          )}
        </div>
      </div>
      {!sendingCelo && !hasGas && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-mustard/30 bg-mustard/10 p-3">
          <Info
            size={14}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-mustard"
          />
          <p className="text-[11.5px] leading-snug text-indigo/80">
            Sending a token needs a small amount of CELO for the network fee,
            and your CELO balance is empty. You&apos;ll need a little CELO
            before this can go through.
          </p>
        </div>
      )}

      <button
        onClick={() => canReview && setStep("review")}
        disabled={!canReview}
        className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition lg:w-[60%] md:w-[60%] disabled:cursor-not-allowed disabled:bg-indigo/40 disabled:text-cream bg-indigo text-cream hover:bg-indigo/90"
      >
        Review
        <ArrowRight size={15} strokeWidth={2.8} />
      </button>
      <div className="mt-4 border-t border-indigo/8 py-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Wallet size={14} strokeWidth={2.5} className="text-fg-soft" />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            Before you send
          </span>
        </div>
        <p className="text-[11px] leading-snug text-fg-soft">
          Sends go out on the Celo network and can&apos;t be undone. Check the
          address and the network match where you want the money to land. When
          in doubt, send a small test amount first.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[12px] text-fg-soft">{label}</span>
      <span
        className={`text-right text-[12.5px] font-semibold text-indigo ${
          mono ? "break-all font-mono text-[11.5px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
