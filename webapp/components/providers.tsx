"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { foundry } from "viem/chains"
import { http } from "viem"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useMemo } from "react"

type Props = { children: ReactNode }

export function Providers({ children }: Props) {
  const queryClient = useMemo(() => new QueryClient(), [])

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "fundup",
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
        chains: [foundry],
        ssr: true,
        transports: {
          [foundry.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
        },
      }),
    []
  )

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({ accentColor: "#7c3aed", borderRadius: "large" })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


