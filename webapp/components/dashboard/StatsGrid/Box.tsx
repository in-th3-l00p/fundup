import { cn } from "@/lib/utils"

export function Box({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-black/10 p-6 flex flex-col items-center justify-center text-center", className)}>
      <div className="text-4xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-black/70">{label}</div>
    </div>
  )
}


