"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  type BaseError,
} from "wagmi";
import type { Abi, Address } from "viem";
import { useCallback } from "react";
import { EXPLORER_BASE } from "@/constants/contracts/address";

export function useContractWrite() {
  const writeMutation = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: writeMutation.data });

  const write = useCallback(
    (args: {
      address: Address;
      abi: Abi;
      functionName: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: readonly any[];
      value?: bigint;
    }) => {
      writeMutation.mutate({
        address: args.address,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        value: args.value,
      });
    },
    [writeMutation]
  );

  const error = writeMutation.error ?? receiptError;
  const errorMessage = error
    ? (error as BaseError).shortMessage ?? error.message
    : null;

  const txHash = writeMutation.data;

  return {
    write,
    txHash,
    isPending: writeMutation.isPending,
    isConfirming,
    isSuccess,
    isIdle:
      !writeMutation.isPending && !isConfirming && !isSuccess && !error,
    error,
    errorMessage,
    explorerUrl: txHash ? `${EXPLORER_BASE}/tx/${txHash}` : null,
    reset: writeMutation.reset,
  };
}