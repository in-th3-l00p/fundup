import { createClient } from "@/utils/supabase/client"

export namespace YieldService {
  export async function get(wallet: string): Promise<number> {
    const supabase = createClient()
    const lower = wallet.toLowerCase()
    // ensure row exists
    await supabase.from("user_yields").upsert({ wallet_address: lower }, { onConflict: "wallet_address" })
    const { data, error } = await supabase.from("user_yields").select("yield_amount_usd").eq("wallet_address", lower).single()
    if (error) throw error
    return Number((data as any)?.yield_amount_usd || 0)
  }

  export async function add(wallet: string, amountUsd: number): Promise<void> {
    if (amountUsd <= 0) return
    const supabase = createClient()
    const lower = wallet.toLowerCase()
    await supabase.from("user_yields").upsert({ wallet_address: lower }, { onConflict: "wallet_address" })
    const { data } = await supabase.from("user_yields").select("yield_amount_usd").eq("wallet_address", lower).single()
    const cur = Number((data as any)?.yield_amount_usd || 0)
    await supabase.from("user_yields").update({ yield_amount_usd: cur + amountUsd }).eq("wallet_address", lower)
  }

  export async function consume(wallet: string, amountUsd: number): Promise<void> {
    if (amountUsd <= 0) return
    const supabase = createClient()
    const lower = wallet.toLowerCase()
    const { data } = await supabase.from("user_yields").select("yield_amount_usd").eq("wallet_address", lower).single()
    const cur = Number((data as any)?.yield_amount_usd || 0)
    const next = Math.max(0, cur - amountUsd)
    await supabase.from("user_yields").update({ yield_amount_usd: next }).eq("wallet_address", lower)
  }
}


