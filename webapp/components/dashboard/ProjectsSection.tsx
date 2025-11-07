"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProjectService, type ProjectWithMeta } from "@/service/ProjectService"
import ReactMarkdown from "react-markdown"
import { useAccount } from "wagmi"

function ProjectCard({ p, currentWallet, earnedUsd = 0, onToggle, disabled, onChanged }: { p: ProjectWithMeta, currentWallet?: string, earnedUsd?: number, onToggle?: (id: number, hasUpvoted: boolean) => Promise<void>, disabled?: boolean, onChanged?: () => Promise<void> | void }) {
  const isOwner = !!currentWallet && p.owner_wallet_address.toLowerCase() === currentWallet.toLowerCase()
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(p.name)
  const [editDesc, setEditDesc] = useState(p.description_md)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const canSave = editName.trim().length > 0 && editDesc.trim().length > 0

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">{p.name}</div>
          <div className="text-sm text-black/70">
            by {" "}
            <button className="underline underline-offset-4">
              {p.owner?.display_name ?? p.owner_wallet_address.slice(0, 6) + "…" + p.owner_wallet_address.slice(-4)}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner ? (
            <>
              <div className="text-sm text-black/70">{p.upvotes_count} upvote{p.upvotes_count === 1 ? "" : "s"}</div>
              {currentWallet ? (
                <Button
                  size="sm"
                  variant={p.has_upvoted ? "default" : "outline"}
                  className={p.has_upvoted ? "bg-violet-600 text-white hover:bg-violet-700" : undefined}
                  disabled={disabled}
                  onClick={() => onToggle && onToggle(p.id, p.has_upvoted)}
                >
                  {p.has_upvoted ? "unvote" : "upvote"}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditName(p.name); setEditDesc(p.description_md); setEditOpen(true) }}>edit</Button>
            </>
          )}
        </div>
      </div>
       <div className="mt-4 text-sm text-black/90">
        <ReactMarkdown>{p.description_md}</ReactMarkdown>
      </div>
       {isOwner ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-black/70">earned: <span className="font-medium text-black">{'$'}{earnedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
           <Button
             size="sm"
             className="bg-violet-600 text-white hover:bg-violet-700"
             disabled={withdrawing || earnedUsd <= 0}
             onClick={async () => {
               setWithdrawing(true)
               try {
                 // mock withdraw for this project
                 console.log("withdraw-project", { id: p.id, amount: earnedUsd })
               } finally {
                 setWithdrawing(false)
               }
             }}
           >
             {withdrawing ? "withdrawing…" : "withdraw"}
           </Button>
         </div>
       ) : null}

      {isOwner ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>update project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor={`uname-${p.id}`}>project name</Label>
                <Input id={`uname-${p.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`udesc-${p.id}`}>description</Label>
                <textarea
                  id={`udesc-${p.id}`}
                  className="min-h-32 w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
                <div className="text-xs text-black/60">Markdown supported</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>cancel</Button>
              <Button
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                disabled={deleting || saving}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await ProjectService.deleteProject(p.id)
                    setEditOpen(false)
                    if (onChanged) await onChanged()
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? "deleting…" : "delete"}
              </Button>
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                disabled={!canSave || saving || deleting}
                onClick={async () => {
                  setSaving(true)
                  try {
                    await ProjectService.updateProject(p.id, { name: editName.trim(), description_md: editDesc.trim() })
                    setEditOpen(false)
                    if (onChanged) await onChanged()
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? "saving…" : "save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}

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
      // sort by upvotes desc
      rows.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
      // randomize the first item via swap with a random index (no duplicates)
      if (rows.length > 1) {
        const rnd = 1 + Math.floor(Math.random() * (rows.length - 1))
        const tmp = rows[0]
        rows[0] = rows[rnd]
        rows[rnd] = tmp
      }
      setItems(rows)
      // assign mock amounts (same logic as donations section)
      const base = [4200, 3000, 1800, 900, 500]
      const m: Record<number, number> = {}
      rows.slice(0, 5).forEach((p, i) => { m[p.id] = base[i] || 0 })
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


