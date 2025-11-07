"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useDisconnect } from "wagmi"
import { ProfileService, type Profile } from "@/service/ProfileService"

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()
  const { disconnect } = useDisconnect()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.replace("/")
      return
    }
    (async () => {
      if (address) {
        try {
          const profile = await ProfileService.getOrCreateProfile(address)
          setProfile(profile)
        } finally {
          setLoading(false)
        }
      }
    })()
  }, [isConnected, router, address])

  if (!isConnected) return null
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white text-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white text-black">
      <main className="w-full max-w-2xl px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-center">dashboard</h1>
        <section className="mt-8 border border-black/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">profile</h2>
            <Button variant="outline" onClick={() => disconnect()}>
              disconnect
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="text-sm text-black/70">display name</label>
            <input
              className="h-10 rounded-md border border-black/15 px-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
              value={profile?.display_name ?? ""}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, display_name: e.target.value } : prev))
              }
              placeholder="your name"
            />
            <label className="text-sm text-black/70">bio</label>
            <textarea
              className="min-h-24 rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-600"
              value={profile?.bio ?? ""}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, bio: e.target.value } : prev))
              }
              placeholder="say something nice"
            />
            <div className="flex justify-end">
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                disabled={saving}
                onClick={async () => {
                  if (!address || !profile) return
                  setSaving(true)
                  try {
                    const saved = await ProfileService.updateProfile(address, {
                      display_name: profile.display_name,
                      bio: profile.bio,
                    })
                    setProfile(saved)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? "saving…" : "save"}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


