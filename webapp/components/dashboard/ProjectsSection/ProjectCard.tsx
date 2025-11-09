import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProjectService, type ProjectWithMeta } from "@/service/ProjectService"
import ReactMarkdown from "react-markdown"

export function ProjectCard({ p, currentWallet, earnedUsd = 0, onToggle, disabled, onChanged }: { p: ProjectWithMeta, currentWallet?: string, earnedUsd?: number, onToggle?: (id: number, hasUpvoted: boolean) => Promise<void>, disabled?: boolean, onChanged?: () => Promise<void> | void }) {
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


