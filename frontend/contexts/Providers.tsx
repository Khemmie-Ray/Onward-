'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { celoSepolia } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { IdentityProvider } from './IdentityContext'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Onward',
  description: "Larn to earn platform",
  url: 'http://localhost:3000', 
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celoSepolia],
  defaultNetwork: celoSepolia,
  metadata: metadata,
  features: {           
    socials: ["google"],    
    emailShowWallets: true, 
    analytics: false 
  }
})

function Providers({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <IdentityProvider>
        {children}
        </IdentityProvider>
        </QueryClientProvider>
    </WagmiProvider>
  )
}

export default Providers