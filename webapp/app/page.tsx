"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Home() {
  const { isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isConnected) 
      router.replace("/dashboard")
    setLoading(false);
  }, [isConnected, router])

  if (loading) 
    return <div className="w-screen h-screen flex items-center justify-center bg-white text-black">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-600"></div>
    </div>

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white text-black">
      <main className="w-full max-w-2xl px-6 text-center">
        <h1 className="text-6xl font-semibold tracking-tight">fundup</h1>
        <p className="mt-4 text-lg text-black/70">
          deposit once. keep principal. route yield to public goods.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <ConnectButton.Custom>
            {({ mounted, account, openConnectModal }) => {
              const connected = mounted && account
              if (connected) return null
              return (
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={openConnectModal}>
                  connect wallet
                </Button>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </main>
    </div>
  )
}
