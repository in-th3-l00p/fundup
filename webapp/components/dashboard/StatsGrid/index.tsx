"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccount } from "wagmi"
import { Web3 } from "@/service/web3"
import { TotalDonated } from "./TotalDonated"
import { YourYield } from "./YourYield"
import { YourLocked } from "./YourLocked"

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
      const d = await Web3.getUsdcDecimals()
      setDecimals(d)
      // total donated = USDC balance held by donation splitter
      const donated = await Web3.getTotalDonatedUsdc()
      setTotalDonated(`$${toTwo(Web3.format(donated, d))}`)
      if (address) {
        const bal = await Web3.getUsdcBalance(address)
        const dep = await Web3.getVaultAssets(address)
        setTokenBal(toTwo(Web3.format(bal, d)))
        setYourLocked(`${toTwo(Web3.format(dep, d))} USDC`)
        // your yield = current assets - principal (tracked in localStorage per address)
        const key = `principal:${address.toLowerCase()}`
        const principalStr = typeof window !== "undefined" ? window.localStorage.getItem(key) || "0" : "0"
        const principal = BigInt(principalStr)
        const yieldNow = dep > principal ? dep - principal : BigInt(0)
        setYourYield(`$${toTwo(Web3.format(yieldNow, d))}`)
      } else {
        setTokenBal("0.00")
        setYourLocked("0.00 USDC")
        setYourYield("$0.00")
      }
      // refresh projects list for donation modal
      const list = await Web3.listProjects()
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
                  // compute current yield in base units
                  const d = await Web3.getUsdcDecimals()
                  const dep = await Web3.getVaultAssets(address!)
                  const key = `principal:${address.toLowerCase()}`
                  const principalStr = typeof window !== "undefined" ? window.localStorage.getItem(key) || "0" : "0"
                  const principal = BigInt(principalStr)
                  const yieldNow = dep > principal ? dep - principal : 0n
                  if (yieldNow > 0n) {
                    // transfer yield to donation splitter and distribute
                    await Web3.transferUsdc(address!, Web3.addresses.donationSplitter, yieldNow)
                    await Web3.distribute()
                    // reset principal to current assets after donating yield
                    if (typeof window !== "undefined") window.localStorage.setItem(key, dep.toString())
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
                  const parsed = Web3.parse(amount, decimals)
                  await Web3.depositToVault(address, parsed)
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


