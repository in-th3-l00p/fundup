"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAccount } from "wagmi"
import { Web3 } from "@/service/web3"

function Box({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-black/10 p-6 flex flex-col items-center justify-center text-center", className)}>
      <div className="text-4xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-black/70">{label}</div>
    </div>
  )
}

export function StatsGrid() {
  const { address } = useAccount()
  const totalDonated = useMemo(() => "$12,345", [])
  const yourYield = useMemo(() => "$123.45", [])
  const [decimals, setDecimals] = useState<number>(6)
  const [tokenBal, setTokenBal] = useState<string>("0.00")
  const [yourLocked, setYourLocked] = useState<string>("0.00 USDC")

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    try {
      const d = await Web3.getUsdcDecimals()
      setDecimals(d)
      if (address) {
        const bal = await Web3.getUsdcBalance(address)
        const dep = await Web3.getVaultAssets(address)
        setTokenBal(Web3.format(bal, d))
        setYourLocked(`${Web3.format(dep, d)} USDC`)
      } else {
        setTokenBal("0.00")
        setYourLocked("0.00 USDC")
      }
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
        <Box value={totalDonated} label="total donated yield" className="row-span-1 col-start-0 col-end-0" />
        <Box value={yourYield} label="your yield" />
        <Box value={yourLocked} label="your locked amount" />
        <Button className="col-2">donate</Button>
        <Button onClick={() => { setOpen(true); refresh() }} className="col-3">
          deposit
        </Button>
      </div>

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


