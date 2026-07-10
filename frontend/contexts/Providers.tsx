"use client";

import React, { type ReactNode } from "react";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import web3AuthContextConfig from "@/config/web3authContext";
import { IdentityProvider } from "./IdentityContext";
import { SiweGate } from "./SiweGate";

const queryClient = new QueryClient();

function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <SessionProvider>
            <SiweGate />
            <IdentityProvider>{children}</IdentityProvider>
          </SessionProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}

export default Providers;
