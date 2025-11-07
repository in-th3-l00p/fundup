"use client"

import { useEffect, useState } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProfileService, type Profile } from "@/service/ProfileService"

function shortName(addr: string) {
  if (!addr) return ""
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

export function ProfileSection() {
  const { isConnected, address, status } = useAccount()
  const router = useRouter()
  const { disconnect } = useDisconnect()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (status !== "connected") return
    if (!isConnected || !address) return
    ;(async () => {
      try {
        const prof = await ProfileService.getOrCreateProfile(address)
        setProfile(prof)
      } finally {
        setLoading(false)
      }
    })()
  }, [isConnected, status, address])

  if (!isConnected) return null

  return (
    <section className="mt-8 border border-black/10 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">profile</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAddress((v) => !v)}
          >
            {showAddress ? "hide address" : "show address"}
          </Button>
          <Button
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={() => {
              disconnect()
              router.replace("/")
            }}
          >
            disconnect
          </Button>
        </div>
      </div>
      {showAddress ? (
        <div className="text-sm text-black/80 break-all">
          {address}
        </div>
      ) : (
        <div className="text-sm text-black/80 break-all">
          {shortName(address || "")}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-sm text-black/60">loading…</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3">
          <label className="text-sm text-black/70">display name</label>
          <input
            className="h-10 rounded-md border border-black/15 px-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
            value={profile?.display_name ?? ""}
            onChange={(e) =>
              setProfile((prev) => (prev ? { ...prev, display_name: e.target.value } : prev))
            }
            onBlur={async (e) => {
              if (!address || !profile) return
              setSaving(true)
              try {
                const saved = await ProfileService.updateProfile(address, {
                  display_name: e.target.value,
                })
                setProfile(saved)
              } finally {
                setSaving(false)
              }
            }}
            placeholder="your name"
          />
          <label className="text-sm text-black/70">bio</label>
          <textarea
            className="min-h-24 rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-600"
            value={profile?.bio ?? ""}
            onChange={(e) =>
              setProfile((prev) => (prev ? { ...prev, bio: e.target.value } : prev))
            }
            onBlur={async (e) => {
              if (!address || !profile) return
              setSaving(true)
              try {
                const saved = await ProfileService.updateProfile(address, {
                  bio: e.target.value,
                })
                setProfile(saved)
              } finally {
                setSaving(false)
              }
            }}
            placeholder="say something nice"
          />
          {saving ? (
            <div className="text-right text-sm text-black/60">saving…</div>
          ) : (
            <div className="text-right text-sm text-black/60">saved</div>
          )}
        </div>
      )}
    </section>
  )
}


