"use client"

import { useEffect, useMemo, useState } from "react"
import { ProjectService, type ProjectWithMeta } from "@/service/ProjectService"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { cn } from "@/lib/utils"

type SplitEntry = { id: number; name: string; amountUsd: number; owner?: string | null }

function formatUsd(v: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v)
}

export function DonationsSection() {
  const { address } = useAccount()
  const [projects, setProjects] = useState<ProjectWithMeta[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const rows = await ProjectService.listProjects(undefined, address)
        setProjects(rows)
      } finally {
        setLoading(false)
      }
    })()
  }, [address])

  const splits = useMemo<SplitEntry[]>(() => {
    const rows = projects || []
    // pick up to 5 projects deterministically and assign mock amounts
    const base = [4200, 3000, 1800, 900, 500]
    const picked = rows.slice(0, 5).map((p, i) => ({ id: p.id, name: p.name, amountUsd: base[i] || 0, owner: p.owner_wallet_address }))
    return picked
  }, [projects])

  const total = useMemo(() => splits.reduce((s, e) => s + e.amountUsd, 0), [splits])

  const you = useMemo(() => {
    if (!address) return { sum: 0, count: 0 }
    const lower = address.toLowerCase()
    const subset = splits.filter((e) => (e.owner || "").toLowerCase() === lower)
    return { sum: subset.reduce((s, e) => s + e.amountUsd, 0), count: subset.length }
  }, [splits, address])

  const [withdrawing, setWithdrawing] = useState(false)

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">donations split</h2>
      <div className="rounded-xl border border-black/10 p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-black/60">loading…</div>
        ) : !splits.length ? (
          <div className="text-sm text-black/60">no projects to split yet</div>
        ) : (
          <div className="space-y-3">
            {splits.map((e) => {
              const pct = total > 0 ? Math.round((e.amountUsd / total) * 100) : 0
              return (
                <div key={e.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-black/70">{formatUsd(e.amountUsd)} • {pct}%</div>
                  </div>
                  <div className="h-2 w-full rounded-md bg-black/10 overflow-hidden">
                    <div className={cn("h-full bg-violet-600")}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-black/70">you received</div>
            <div className="text-2xl font-semibold">{formatUsd(you.sum)} <span className="text-base font-normal text-black/60">across {you.count} project{you.count === 1 ? "" : "s"}</span></div>
          </div>
          <Button
            className="bg-violet-600 text-white hover:bg-violet-700"
            disabled={withdrawing || you.sum <= 0}
            onClick={async () => {
              setWithdrawing(true)
              try {
                // mock withdraw all donations to your projects
                console.log("withdraw-all", { total: you.sum })
              } finally {
                setWithdrawing(false)
              }
            }}
          >
            {withdrawing ? "withdrawing…" : "withdraw"}
          </Button>
        </div>
        {!loading && splits.length ? (
          <div className="mt-2 grid gap-2">
            {splits.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div className="truncate pr-3">{e.name}</div>
                <div className="text-black/70">{formatUsd(e.amountUsd)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}


