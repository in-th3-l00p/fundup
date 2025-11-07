"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProjectService, type ProjectWithOwner } from "@/service/ProjectService"
import ReactMarkdown from "react-markdown"
import { useAccount } from "wagmi"

function ProjectCard({ p }: { p: ProjectWithOwner }) {
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">{p.name}</div>
        <div className="text-sm text-black/70">
          by {" "}
          <button className="underline underline-offset-4">
            {p.owner?.display_name ?? p.owner_wallet_address.slice(0, 6) + "…" + p.owner_wallet_address.slice(-4)}
          </button>
        </div>
      </div>
      <div className="mt-4 text-sm text-black/90">
        <ReactMarkdown>{p.description_md}</ReactMarkdown>
      </div>
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
  const [items, setItems] = useState<ProjectWithOwner[] | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const rows = await ProjectService.listProjects(search)
      setItems(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canCreate = useMemo(() => !!address && name.trim().length > 0 && desc.trim().length > 0, [address, name, desc])

  return (
    <section className="space-y-4">
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
      </div>

      {loading ? (
        <div className="text-sm text-black/60 text-center">loading…</div>
      ) : !(items && items.length) ? (
        <div className="rounded-xl border border-black/10 p-6 text-center text-sm text-black/60">no projects found</div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  )
}


