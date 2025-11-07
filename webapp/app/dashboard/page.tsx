"use client"

import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) router.replace("/")
  }, [isConnected, router])

  if (!isConnected) return null

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white text-black">
      <main className="w-full max-w-2xl px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">dashboard</h1>
        <p className="mt-3 text-black/70">connected as {address}</p>
      </main>
    </div>
  )
}


