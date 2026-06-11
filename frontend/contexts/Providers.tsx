"use client";

import { wagmiAdapter, projectId } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { celo } from "@reown/appkit/networks";
import { SessionProvider } from "next-auth/react";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { IdentityProvider } from "./IdentityContext";
import { siweConfig } from "@/lib/siwe-config";

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const metadata = {
  name: "Onward",
  description: "Learn-to-earn for the GoodDollar ecosystem",
  url: "https://onward-celo.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celo],
  defaultNetwork: celo,
  metadata,
  siweConfig,
  features: {
    socials: ["google"],
    emailShowWallets: true,
    analytics: false,
  },
});

function Providers({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <IdentityProvider>{children}</IdentityProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Providers;
