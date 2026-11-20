"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  ExternalLink,
  Loader2,
  Lock,
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
} from "@/hooks/useTokenBalances";
import { EXPLORER_BASE } from "@/constants/contracts/address";

type Step = "form" | "review";

const SENDABLE = [
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
  {
    key: "CELO",
    symbol: "CELO",
    name: "Celo",
    address: null as Address | null,
  },
] as const;

// Small inline token coin, so the wallet styling stays in this file.
function TokenCoin({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    G$: { bg: "bg-mustard", fg: "text-indigo", label: "G$" },
    CELO: { bg: "bg-[#FBCB46]", fg: "text-indigo", label: "C" },
    USDT: { bg: "bg-forest", fg: "text-cream", label: "₮" },
  };
  const s = map[symbol] ?? {
    bg: "bg-cream/20",
    fg: "text-cream",
    label: symbol[0],
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${s.bg} ${s.fg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {s.label}
    </span>
  );
}

export function WithdrawCard() {
  return <WithdrawPanel />;
}

export function SwapComingSoon() {
  return (
    <div className="rounded-[20px] bg-indigo p-6 text-cream">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream/5">
          <Lock size={20} strokeWidth={2.5} className="text-cream/60" />
        </div>
        <h3 className="display mb-1.5 text-[20px] font-bold text-cream">
          Swap is coming soon
        </h3>
        <p className="max-w-70 text-[12.5px] leading-[1.55] text-cream/60">
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
    useState<(typeof SENDABLE)[number]["key"]>("G$");
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="rounded-[20px] bg-indigo p-5 text-cream sm:p-6">
        <div className="mb-4 rounded-xl bg-cream/5 p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-cream/50">
            Check before you send
          </div>
          <ReviewRow label="Sending" value={`${amount} ${token.symbol}`} />
          <ReviewRow label="To" value={to.trim()} mono />
          <ReviewRow label="Network" value="Celo" />
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl bg-cream/5 p-3">
          <AlertTriangle
            size={14}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-mustard"
          />
          <p className="text-[11.5px] leading-snug text-cream/80">
            This sends on the Celo network and cannot be reversed. Make sure the
            address is correct and can receive on Celo. If you&apos;re unsure,
            send a small amount first.
          </p>
        </div>

        {error && (
          <p className="mb-3 text-center text-[11.5px] font-semibold text-[#F2A68C]">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setStep("form")}
            disabled={sending}
            className="flex-1 rounded-2xl bg-cream/10 py-3.5 text-[13px] font-bold text-cream transition hover:bg-cream/20 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={doSend}
            disabled={sending}
            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-cream transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-forest/40"
          >
            {sending ? (
              <>
                <Loader2 size={15} strokeWidth={2.8} className="animate-spin" />
                Sending…
              </>
            ) : (
              `Confirm — send ${amount} ${token.symbol}`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-indigo p-5 text-cream sm:p-6">
      {txHash && (
        <a
          href={`${EXPLORER_BASE}tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-forest/20 py-2.5 text-[11.5px] font-semibold text-[#9BE3B4] transition hover:bg-forest/30"
        >
          Sent. View on the explorer
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
      )}
      <div className="rounded-2xl bg-cream/5 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cream/50">
            Amount
          </span>
          <div className="relative flex items-center gap-2">
            <button
              onClick={handleMax}
              className="rounded-full bg-cream/10 px-3 py-1 text-[11px] font-bold text-cream/80 transition hover:bg-cream/20"
            >
              MAX
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-cream/10 px-2.5 py-1 text-[12px] font-bold text-cream transition hover:bg-cream/20"
            >
              <TokenCoin symbol={token.symbol} />
              {token.symbol}
              <ChevronDown size={13} strokeWidth={2.5} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-56 overflow-hidden rounded-2xl bg-paper p-1.5 shadow-[0_12px_40px_rgba(31,58,110,0.25)]">
                {SENDABLE.map((t) => {
                  const b = balances.find((x) => x.symbol === t.symbol);
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTokenKey(t.key);
                        setAmount("");
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-canvas-warm ${
                        t.key === tokenKey ? "bg-canvas-warm" : ""
                      }`}
                    >
                      <TokenCoin symbol={t.symbol} size={26} />
                      <span className="flex-1 text-[13px] font-bold text-indigo">
                        {t.symbol}
                      </span>
                      <span className="text-[12px] font-semibold tabular-nums text-fg-soft">
                        {b ? formatBalance(b.formatted) : "0"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if (v.split(".").length <= 2) setAmount(v);
          }}
          className="mt-1 w-full bg-transparent text-[26px] font-bold text-cream outline-none tabular-nums placeholder:text-cream/30"
        />
        {overBalance && (
          <p className="mt-1 text-[11px] font-semibold text-[#F2A68C]">
            More than your {token.symbol} balance.
          </p>
        )}
      </div>

      <div className="my-2 flex justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/5 text-cream/60">
          <ArrowDown size={16} strokeWidth={2.5} />
        </div>
      </div>

      {/* Destination */}
      <div className="rounded-2xl bg-cream/5 px-4 py-3.5">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cream/50">
          To a Celo address
        </div>
        <input
          placeholder="0x…"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[14px] text-cream outline-none placeholder:text-cream/30"
        />
        {to.trim() !== "" && !addressValid && (
          <p className="mt-1 text-[11px] font-semibold text-[#F2A68C]">
            That doesn&apos;t look like a valid address. It should start with 0x
            and be 42 characters.
          </p>
        )}
      </div>

      {!sendingCelo && !hasGas && (
        <p className="mt-3 text-right text-[11.5px] text-cream/50">
          Sending a token needs a little CELO for the network fee.
        </p>
      )}

      <button
        onClick={() => canReview && setStep("review")}
        disabled={!canReview}
        className="mt-4 w-full rounded-2xl bg-forest py-3.5 text-sm font-bold text-cream transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-forest/40"
      >
        Withdraw {amountValid ? `${amount} ` : ""}
        {token.symbol}
      </button>
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
      <span className="shrink-0 text-[12px] text-cream/60">{label}</span>
      <span
        className={`text-right text-[12.5px] font-semibold text-cream ${
          mono ? "break-all font-mono text-[11.5px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
