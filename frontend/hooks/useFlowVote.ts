"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import {
  encodeFunctionData,
  formatEther,
  zeroAddress,
  type Address,
  type Hash,
} from "viem";
import { celo } from "viem/chains";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  IDENTITY_ABI,
  IDENTITY_CONTRACT,
  PROJECT_NAME,
  PROJECT_RECIPIENT,
  FLOW_ABI,
  FLOW_CHAIN,
  FLOW_COUNCIL,
  buildFlowVote,
  flowAllocation,
  flowClaimMessage,
  flowSnapshotKey,
  matchesFlowVoteTransaction,
  type FlowMetadata,
  type FlowSnapshot,
  type FlowVote,
} from "@/lib/onchain/flowstate";

type ErrLike = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  cause?: unknown;
};

function isUserRejectedTx(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as ErrLike;
  if (e.code === 4001 || e.name === "UserRejectedRequestError") return true;
  if (
    typeof e.message === "string" &&
    /user rejected|rejected the request|user denied|user cancel|request rejected/i.test(
      e.message,
    )
  ) {
    return true;
  }
  return isUserRejectedTx(e.cause);
}

function isInsufficientFunds(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as ErrLike;
  const text = [e.message, e.shortMessage, e.name]
    .filter((v) => typeof v === "string")
    .join(" ");
  return (
    /insufficient funds|insufficient balance|exceeds balance|gas required exceeds|InsufficientFunds/i.test(
      text,
    ) || isInsufficientFunds(e.cause)
  );
}

const NEEDS_CELO =
  "Your wallet needs a little CELO for the network fee and we couldn't add it right now. Please try again in a few minutes.";

const DEFAULT_VOTES = 10n;

type Pending = { hash: Hash; amount: string };
type Review = {
  snapshotKey: string;
  amount: string;
  votes: FlowVote[];
  fee: string;
};

const pendingKey = (address: Address) =>
  `flow-vote:${FLOW_CHAIN}:${FLOW_COUNCIL}:${address.toLowerCase()}`;

function readPending(address: Address): Pending | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(
      localStorage.getItem(pendingKey(address)) ?? "null",
    );
    if (
      saved &&
      /^0x[0-9a-f]{64}$/i.test(saved.hash) &&
      /^\d{1,29}$/.test(saved.amount)
    ) {
      return saved as Pending;
    }
  } catch {
    // Blocked storage doesn't stop the in-memory flow.
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function json(response: Response) {
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== "object") {
    throw new Error(
      "The voting service returned an incomplete response. Please retry.",
    );
  }
  if (!response.ok) {
    throw new Error(
      data.error ?? "The voting service is unavailable. Please retry.",
    );
  }
  return data;
}

export function useFlowVote(address: Address) {
  const client = usePublicClient({ chainId: FLOW_CHAIN });
  const { address: connected, chainId } = useConnection();
  const { data: walletClient } = useWalletClient({ chainId: FLOW_CHAIN });
  const switchChain = useSwitchChain();
  const authFetch = useAuthFetch();

  const [metadata, setMetadata] = useState<FlowMetadata | null>(null);
  const [snapshot, setSnapshot] = useState<FlowSnapshot | null>(null);
  const [amount, setAmountState] = useState("");
  const [review, setReview] = useState<Review | null>(null);
 
  const [pending, setPending] = useState<Pending | null>(() =>
    readPending(address),
  );
  const [confirmed, setConfirmed] = useState<Pending | null>(null);
  const [busy, setBusy] = useState("Checking your voting status…");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const mounted = useRef(true);
  const running = useRef(false);

  const connectedRef = useRef(connected);
  const chainRef = useRef(chainId);
  const walletRef = useRef(walletClient);
  useEffect(() => {
    connectedRef.current = connected;
    chainRef.current = chainId;
    walletRef.current = walletClient;
  }, [connected, chainId, walletClient]);

  const assertOwner = useCallback(() => {
    if (
      !mounted.current ||
      connectedRef.current?.toLowerCase() !== address.toLowerCase()
    ) {
      throw new Error(
        "Your wallet changed. Reopen voting with the account you want to use.",
      );
    }
  }, [address]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [address]);

  const readSnapshot = useCallback(async (): Promise<FlowSnapshot> => {
    if (!client)
      throw new Error("Celo connection is unavailable. Please retry.");
    const [voter, votes, maxSpread, root, recipient] = await Promise.all([
      client.readContract({
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "getVoter",
        args: [address],
      }),
      client.readContract({
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "getVotes",
        args: [address],
      }),
      client.readContract({
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "maxVotingSpread",
      }),
      client.readContract({
        address: IDENTITY_CONTRACT,
        abi: IDENTITY_ABI,
        functionName: "getWhitelistedRoot",
        args: [address],
      }),
      client.readContract({
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "getRecipient",
        args: [PROJECT_RECIPIENT],
      }),
    ]);
    return {
      votingPower: voter.votingPower,
      votes,
      maxSpread,
      verified: root !== zeroAddress,
      recipientActive: recipient.account.toLowerCase() === PROJECT_RECIPIENT,
    };
  }, [address, client]);

  const refresh = useCallback(async () => {
    const [meta, state] = await Promise.all([
      fetch("/api/flowstate", { cache: "no-store" }).then(json),
      readSnapshot(),
    ]);
    assertOwner();
    setMetadata(meta);
    setSnapshot(state);
    setReview(null);
    const allocation = flowAllocation(state);
    setAmountState(
      allocation.current > 0n
        ? String(allocation.current)
        : allocation.maximum > 0n
          ? String(
              allocation.maximum < DEFAULT_VOTES
                ? allocation.maximum
                : DEFAULT_VOTES,
            )
          : "",
    );
    return state;
  }, [assertOwner, readSnapshot]);

  async function run(label: string, action: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      assertOwner();
      await action();
    } catch (err) {
      if (mounted.current) {
        if (isUserRejectedTx(err)) {
          setNotice("Cancelled. No vote was sent.");
        } else if (isInsufficientFunds(err)) {
          setError(NEEDS_CELO);
        } else {
          setError(
            err instanceof Error && err.message.length < 260
              ? err.message
              : "Couldn't finish this step. Refresh your voting status and try again.",
          );
        }
      }
    } finally {
      running.current = false;
      if (mounted.current) setBusy("");
    }
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let message = "";
      try {
        await refresh();
      } catch (err) {
        message =
          err instanceof Error && err.message.length < 260
            ? err.message
            : "Couldn't load your voting status. Please retry.";
      }
      if (cancelled) return;
      if (message) setError(message);
      setBusy("");
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function wallet() {
    assertOwner();
    if (chainRef.current !== FLOW_CHAIN) {
      await switchChain.mutateAsync({ chainId: FLOW_CHAIN });
      // Give wagmi a moment to hand back a wallet client for Celo.
      for (let i = 0; i < 10 && !walletRef.current; i++) await sleep(300);
    }
    assertOwner();
    const signer = walletRef.current;
    if (!signer)
      throw new Error("Your wallet isn't ready yet. Please try again.");
    if (signer.account.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Your wallet changed. Please refresh.");
    }
    return signer;
  }

  /** Makes sure the wallet can pay the vote's network fee, using the faucet. */
  async function ensureFee(needed: bigint) {
    if (!client) throw new Error("Celo connection is unavailable.");
    let balance = await client.getBalance({ address });
    if (balance >= needed) return;

    setBusy("Adding a little CELO for the network fee…");
    try {
      await authFetch("/api/gas/prepare", { method: "POST" });
    } catch {
      // Checked below by reading the balance.
    }
    for (let i = 0; i < 12 && balance < needed; i++) {
      await sleep(1500);
      balance = await client.getBalance({ address });
    }
    if (balance < needed) throw new Error(NEEDS_CELO);
  }

  const claim = () =>
    run("Confirm your voting rights…", async () => {
      const state = await refresh();
      if (!state.verified) throw new Error("Verify with GoodID first.");
      if (state.votingPower > 0n) {
        setNotice("Your voting rights are already active.");
        return;
      }
      const signer = await wallet();
      const issuedAt = Date.now();
      const signature = await signer.signMessage({
        account: address,
        message: flowClaimMessage(address, issuedAt),
      });
      assertOwner();
      setBusy("Activating your voting rights…");
      await authFetch("/api/flowstate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-flow-vote": "1" },
        body: JSON.stringify({ address, issuedAt, signature }),
        signal: AbortSignal.timeout(25_000),
      }).then(json);
      const updated = await refresh();
      setNotice(
        updated.votingPower > 0n
          ? "Voting rights active. Choose how many votes to give below."
          : "Request received. Refresh in a moment to load your votes.",
      );
    });

  const prepare = () =>
    run("Preparing your vote…", async () => {
      if (!client || !metadata)
        throw new Error("Refresh your voting status first.");
      const state = await readSnapshot();
      assertOwner();
      setSnapshot(state);
      const votes = buildFlowVote(state, amount);
      const data = encodeFunctionData({
        abi: FLOW_ABI,
        functionName: "vote",
        args: [votes],
      });
      await client.simulateContract({
        account: address,
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "vote",
        args: [votes],
      });
      const [gas, gasPrice] = await Promise.all([
        client.estimateGas({ account: address, to: FLOW_COUNCIL, data }),
        client.getGasPrice(),
      ]);
      const estimated = (gas * gasPrice * 12n) / 10n;
      await ensureFee(estimated);
      assertOwner();
      setReview({
        snapshotKey: flowSnapshotKey(state),
        amount: votes[0].amount.toString(),
        votes,
        fee: formatEther(estimated),
      });
    });

  async function finishReceipt(record: Pending, wait: boolean) {
    if (!client) throw new Error("Celo connection is unavailable.");
    let receipt;
    try {
      receipt = wait
        ? await client.waitForTransactionReceipt({
            hash: record.hash,
            confirmations: 1,
            timeout: 45_000,
          })
        : await client.getTransactionReceipt({ hash: record.hash });
    } catch {
      if (mounted.current) {
        setNotice(
          "Your vote was sent and is still confirming. Check its status below. Don't send it again.",
        );
      }
      return;
    }

    if (receipt.status === "success") {
      // A successful receipt alone doesn't prove this ballot was cast.
      let tx;
      try {
        tx = await client.getTransaction({ hash: receipt.transactionHash });
      } catch {
        if (mounted.current) {
          setNotice(
            "The vote confirmed, but we couldn't check it yet. Check its status again.",
          );
        }
        return;
      }
      if (!matchesFlowVoteTransaction(address, record.amount, tx)) {
        try {
          localStorage.removeItem(pendingKey(address));
        } catch {
          // optional
        }
        if (mounted.current) {
          setPending(null);
          setReview(null);
        }
        throw new Error(
          "This transaction didn't cast the vote you reviewed. Refresh before trying again.",
        );
      }
    }

    try {
      localStorage.removeItem(pendingKey(address));
    } catch {
      // optional
    }
    if (!mounted.current) return;
    assertOwner();
    setPending(null);
    setReview(null);
    if (receipt.status !== "success") {
      throw new Error(
        "The vote didn't go through. Refresh before trying again. A small network fee may have been charged.",
      );
    }
    setConfirmed({ ...record, hash: receipt.transactionHash });
    setNotice(
      `Your vote is confirmed. Thank you for supporting ${PROJECT_NAME}!`,
    );
    try {
      await refresh();
    } catch {
      setNotice(
        "Your vote is confirmed. Your latest votes couldn't be refreshed yet.",
      );
    }
  }

  const submit = () =>
    run("Confirm your vote…", async () => {
      if (!review || pending || !client) return;
      const signer = await wallet();
      const state = await readSnapshot();
      assertOwner();
      if (flowSnapshotKey(state) !== review.snapshotKey) {
        setSnapshot(state);
        setReview(null);
        throw new Error(
          "Your votes changed since you reviewed them. Review again before confirming.",
        );
      }
      const votes = buildFlowVote(state, review.amount);
      await client.simulateContract({
        account: address,
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "vote",
        args: [votes],
      });
      assertOwner();
      const hash = await signer.writeContract({
        chain: celo,
        account: address,
        address: FLOW_COUNCIL,
        abi: FLOW_ABI,
        functionName: "vote",
        args: [votes],
      });
      const record = { hash, amount: review.amount };
      try {
        localStorage.setItem(pendingKey(address), JSON.stringify(record));
      } catch {
        // The hash stays in the visible pending state.
      }
      if (!mounted.current) return;
      setPending(record);
      setReview(null);
      setBusy("Waiting for confirmation…");
      await finishReceipt(record, true);
    });

  return {
    metadata,
    snapshot,
    amount,
    setAmount: (value: string) => {
      setAmountState(value);
      setReview(null);
      setConfirmed(null);
    },
    review,
    cancelReview: () => setReview(null),
    pending,
    confirmed,
    busy,
    error,
    notice,
    refresh: () =>
      run("Refreshing your voting status…", async () => {
        await refresh();
      }),
    claim,
    prepare,
    submit,
    checkPending: () =>
      run("Checking your vote…", async () => {
        if (pending) await finishReceipt(pending, false);
      }),
  };
}
