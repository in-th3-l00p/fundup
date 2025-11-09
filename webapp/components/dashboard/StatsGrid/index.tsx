"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccount } from "wagmi"
import { MockChain } from "@/service/mock"
import { TotalDonated } from "./TotalDonated"
import { YourYield } from "./YourYield"
import { YourLocked } from "./YourLocked"
import { ProjectService } from "@/service/ProjectService"
import { YieldService } from "@/service/YieldService"

export function StatsGrid() {
  const { address } = useAccount()
  const [totalDonated, setTotalDonated] = useState<string>("$0.00")
  const [yourYield, setYourYield] = useState<string>("$0.00")
  const [decimals, setDecimals] = useState<number>(2)
  const [tokenBal, setTokenBal] = useState<string>("0.00")
  const [yourLocked, setYourLocked] = useState<string>("0.00 USDC")

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: number; recipient: string; active: boolean; votes: bigint }>>([])
  const [donating, setDonating] = useState(false)

  const toTwo = (s: string) =>
    Number(isNaN(Number(s)) ? "0" : s).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  async function refresh() {
    try {
      const d = await MockChain.usdc.getDecimals()
      setDecimals(d)
      // total donated = sum over projects.donated_amount_usd (supabase)
      const donatedUsd = await ProjectService.getTotalDonatedUsd()
      setTotalDonated(`$${toTwo(String(donatedUsd))}`)
      if (address) {
        const bal = await MockChain.usdc.getBalance(address)
        const dep = await MockChain.vault.getAssets(address)
        setTokenBal(toTwo(MockChain.format(bal, d)))
        // locked is principal deposited (mock: equals vault assets since yield is tracked separately)
        setYourLocked(`${toTwo(MockChain.format(dep, d))} USDC`)
        // your yield is tracked in Supabase (USD)
        const yUsd = await YieldService.get(address)
        setYourYield(`$${toTwo(String(yUsd))}`)
      } else {
        setTokenBal("0.00")
        setYourLocked("0.00 USDC")
        setYourYield("$0.00")
      }
      // refresh projects list for donation modal
      const list = await MockChain.splitter.listProjects()
      setProjects(list.filter(p => p.active))
    } catch {}
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  return (
    <section id="stats">
      <h2 className="text-lg font-medium">stats</h2>

      <div className="mt-4 grid grid-cols-3 grid-rows-[1fr_20px] gap-4">
        <TotalDonated value={totalDonated} />
        <YourYield value={yourYield} />
        <YourLocked value={yourLocked} />
        <Button
          variant="outline"
          onClick={async () => {
            if (!address) return
            // simulate 1 year of 11% APY on current locked (in USD) and add to Supabase yield
            const dep = await MockChain.vault.getAssets(address)
            const depUsd = Number(dep) / 1e6
            const gainUsd = Math.floor((depUsd * 0.11) * 100) / 100
            await YieldService.add(address, gainUsd)
            await refresh()
          }}
        >
          1 year
        </Button>
        <Button className="col-2" onClick={() => { setDonateOpen(true); refresh() }}>donate</Button>
        <Button onClick={() => { setOpen(true); refresh() }} className="col-3">
          deposit
        </Button>
      </div>

      {/* Donate Modal */}
      <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>donate your yield</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {projects.length === 0 ? (
              <div className="text-sm text-black/60">no projects available</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const totalVotes = projects.reduce((s, p) => s + Number(p.votes), 0)
                  return projects.map((p) => {
                    const pct = totalVotes > 0 ? (Number(p.votes) / totalVotes) * 100 : 0
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium truncate">{p.recipient}</div>
                          <div className="text-black/70">{pct.toFixed(2)}%</div>
                        </div>
                        <div className="h-2 w-full rounded-md bg-black/10 overflow-hidden">
                          <div className="h-full bg-violet-600" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDonateOpen(false)}>cancel</Button>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={donating || yourYield === "$0.00" || !address}
              onClick={async () => {
                if (!address) return
                setDonating(true)
                try {
                  // donate entire current yield (USD) using vote weights
                  const yUsd = await YieldService.get(address)
                  if (yUsd > 0) {
                    const projs = await ProjectService.listProjects(undefined, address)
                    const totalVotes = projs.reduce((s, p) => s + (p.upvotes_count || 0), 0)
                    let remaining = yUsd
                    const splits: Array<{ id: number; amountUsd: number }> = []
                    if (projs.length > 0) {
                      if (totalVotes === 0) {
                        // split equally across all projects
                        const per = Math.floor((yUsd / projs.length) * 100) / 100
                        for (let i = 0; i < projs.length; i++) {
                          if (i === projs.length - 1) {
                            splits.push({ id: projs[i].id, amountUsd: Math.max(0, Math.floor(remaining * 100) / 100) })
                          } else {
                            remaining -= per
                            splits.push({ id: projs[i].id, amountUsd: per })
                          }
                        }
                      } else {
                        for (let i = 0; i < projs.length; i++) {
                          const p = projs[i]
                          if (i === projs.length - 1) {
                            splits.push({ id: p.id, amountUsd: Math.max(0, Math.floor(remaining * 100) / 100) })
                          } else {
                            const amt = ((p.upvotes_count || 0) / totalVotes) * yUsd
                            const rounded = Math.floor(amt * 100) / 100
                            remaining -= rounded
                            if (rounded > 0) splits.push({ id: p.id, amountUsd: rounded })
                          }
                        }
                      }
                      await ProjectService.addDonationsToProjectsSplits(splits)
                      await YieldService.consume(address, yUsd)
                    }
                  }
                  await refresh()
                  setDonateOpen(false)
                } catch (e) {
                  console.error(e)
                } finally {
                  setDonating(false)
                }
              }}
            >
              {donating ? "donating…" : "confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setAmount(""); refresh() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>deposit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="text-sm text-black/70">
              balance: <span className="font-medium text-black">{tokenBal}</span> USDC
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">token</Label>
              <div id="token" className="h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm flex items-center">
                USDC
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>cancel</Button>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={submitting || !address || !amount || Number(amount) <= 0}
              onClick={async () => {
                if (!address) return
                setSubmitting(true)
                try {
                  const parsed = MockChain.parse(amount, decimals)
                  await MockChain.vault.deposit(address, parsed)
                  // bump principal tracker
                  const key = `principal:${address.toLowerCase()}`
                  const prev = typeof window !== "undefined" ? window.localStorage.getItem(key) || "0" : "0"
                  const next = (BigInt(prev) + parsed).toString()
                  if (typeof window !== "undefined") window.localStorage.setItem(key, next)
                  await refresh()
                  setOpen(false)
                  setAmount("")
                } catch (e) {
                  console.error(e)
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? "processing…" : "confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}


