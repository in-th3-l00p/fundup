"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

function Box({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-black/10 p-6 flex flex-col items-center justify-center text-center", className)}>
      <div className="text-4xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-black/70">{label}</div>
    </div>
  )
}

export function StatsGrid() {
  // mocked values
  const totalDonated = useMemo(() => "$12,345", [])
  const yourYield = useMemo(() => "$123.45", [])
  const yourLocked = useMemo(() => "1,000 USDC", [])

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("USDC")
  const [submitting, setSubmitting] = useState(false)

  return (
    <section id="stats">
      <h2 className="text-lg font-medium">stats</h2>

      <div className="mt-4 grid grid-cols-3 grid-rows-[1fr_20px] gap-4">
        <Box value={totalDonated} label="total donated yield" className="row-span-1 col-start-0 col-end-0" />
        <Box value={yourYield} label="your yield" />
        <Box value={yourLocked} label="your locked amount" />
        <Button className="col-2">donate</Button>
        <Button onClick={() => setOpen(true)} className="col-3">
          deposit
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>deposit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
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
              <Select value={token} onValueChange={setToken} >
                <SelectTrigger id="token" className="w-full">
                  <SelectValue placeholder="select token" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>cancel</Button>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true)
                try {
                  // mock deposit
                  console.log("deposit", { amount, token })
                  setOpen(false)
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


