"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProjectService, type ProjectWithMeta } from "@/service/ProjectService"
import { useAccount } from "wagmi"
import { ProjectCard } from "./ProjectCard"

export function ProjectsSection() {
  const { address } = useAccount()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<ProjectWithMeta[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [upvotingId, setUpvotingId] = useState<number | null>(null)
  const [amountsById, setAmountsById] = useState<Record<number, number>>({})
  const [showMineOnly, setShowMineOnly] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const rows = await ProjectService.listProjects(search, address)
      setItems(rows)
      const m: Record<number, number> = {}
      rows.forEach((p) => { m[p.id] = Number((p as any).donated_amount_usd || 0) })
      setAmountsById(m)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canCreate = useMemo(() => !!address && name.trim().length > 0 && desc.trim().length > 0, [address, name, desc])
  const visibleItems = useMemo(() => {
    const arr = items || []
    if (!showMineOnly || !address) return arr
    const me = address.toLowerCase()
    return arr.filter((p) => p.owner_wallet_address.toLowerCase() === me)
  }, [items, showMineOnly, address])

  return (
    <section id="projects" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">projects</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 text-white hover:bg-violet-700">add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>add project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="pname">project name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="my awesome public good" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">description</Label>
                <textarea
                  id="pdesc"
                  className="min-h-32 w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="what are you building and why does it matter?"
                />
                <div className="text-xs text-black/60">Markdown supported</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>cancel</Button>
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                disabled={!canCreate || creating}
                onClick={async () => {
                  if (!address) return
                  setCreating(true)
                  try {
                    await ProjectService.createProject(address, name.trim(), desc.trim())
                    setName("")
                    setDesc("")
                    setOpen(false)
                    await refresh()
                  } finally {
                    setCreating(false)
                  }
                }}
              >
                {creating ? "publishing…" : "publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await refresh()
            }
          }}
        />
        <Button variant="outline" onClick={refresh}>search</Button>
        <label className="ml-auto flex items-center gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-black/30 accent-violet-600"
            checked={showMineOnly}
            onChange={(e) => setShowMineOnly(e.target.checked)}
          />
          mine only
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-black/60 text-center">loading…</div>
      ) : !(visibleItems && visibleItems.length) ? (
        <div className="rounded-xl border border-black/10 p-6 text-center text-sm text-black/60">{showMineOnly ? "no owned projects" : "no projects found"}</div>
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              currentWallet={address}
              earnedUsd={amountsById[p.id] || 0}
              disabled={upvotingId === p.id}
              onChanged={refresh}
              onToggle={async (id, hasUpvoted) => {
                if (!address) return
                setUpvotingId(id)
                try {
                  if (hasUpvoted) {
                    await ProjectService.removeUpvote(id, address)
                  } else {
                    await ProjectService.upvoteProject(id, address)
                  }
                  await refresh()
                } finally {
                  setUpvotingId(null)
                }
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}


