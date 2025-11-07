"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DialogContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode }) {
  const [localOpen, setLocalOpen] = React.useState(false)
  const isControlled = typeof open === "boolean"
  const actualOpen = isControlled ? open! : localOpen
  const setOpen = (v: boolean) => {
    if (!isControlled) setLocalOpen(v)
    onOpenChange?.(v)
  }
  return (
    <DialogContext.Provider value={{ open: actualOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>")
  return ctx
}

function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const { setOpen } = useDialog()
  if (asChild) {
    return React.cloneElement(children, { onClick: () => setOpen(true) })
  }
  return (
    <button onClick={() => setOpen(true)} className="hidden" aria-hidden>
      open
    </button>
  )
}

function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = useDialog()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className={cn("absolute left-1/2 top-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white p-4 shadow-xl", className)}>
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-black/60">{children}</p>
}

function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex items-center justify-end gap-2">{children}</div>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }


