import { createClient } from "@/utils/supabase/client"
import { ProfileService, type Profile } from "@/service/ProfileService"
import { MockChain } from "@/service/mock"

export type Project = {
  id: number
  owner_wallet_address: string
  name: string
  description_md: string
  donated_amount_usd?: number
  created_at?: string
  updated_at?: string
}

export type ProjectWithOwner = Project & { owner?: Profile | null }
export type ProjectWithMeta = ProjectWithOwner & { upvotes_count: number; has_upvoted: boolean }

export namespace ProjectService {
  export async function createProject(ownerWallet: string, name: string, description_md: string): Promise<Project> {
    const supabase = createClient()
    // create in DB first to get project id
    const { data, error } = await supabase
      .from("projects")
      .insert({ owner_wallet_address: ownerWallet.toLowerCase(), name, description_md })
      .select()
      .single()
    if (error) throw error
    return data as Project
  }

  export async function listProjects(query?: string, currentWallet?: string): Promise<ProjectWithMeta[]> {
    const supabase = createClient()
    let req = supabase
      .from("projects")
      .select("id, owner_wallet_address, name, description_md, donated_amount_usd, created_at, updated_at")
      .order("created_at", { ascending: false })
    if (query && query.trim().length > 0) {
      req = req.or(`name.ilike.%${query}%,description_md.ilike.%${query}%`)
    }
    const { data, error } = await req
    if (error) throw error
    const rows = (data as Project[]) || []

    // fetch owners
    const owners: Array<Profile | null> = []
    for (const p of rows) {
      try {
        const owner = await ProfileService.getOrCreateProfile(p.owner_wallet_address)
        owners.push(owner)
      } catch {
        owners.push(null)
      }
    }

    const projectIds = rows.map((r) => r.id)

    // fetch upvote counts for visible projects
    const { data: upvoteRows, error: upvoteErr } = await supabase
      .from("project_upvotes")
      .select("project_id")
      .in("project_id", projectIds)
    if (upvoteErr) throw upvoteErr
    const idToCount = new Map<number, number>()
    for (const row of upvoteRows || []) {
      const pid = (row as any).project_id as number
      idToCount.set(pid, (idToCount.get(pid) || 0) + 1)
    }

    // fetch whether current wallet has upvoted
    const walletLower = currentWallet?.toLowerCase()
    let userUpvotes = new Set<number>()
    if (walletLower) {
      const { data: mineRows, error: mineErr } = await supabase
        .from("project_upvotes")
        .select("project_id")
        .eq("voter_wallet_address", walletLower)
        .in("project_id", projectIds)
      if (mineErr) throw mineErr
      userUpvotes = new Set<number>((mineRows || []).map((r) => (r as any).project_id as number))
    }

    const results: ProjectWithMeta[] = rows.map((p, idx) => {
      const owner = owners[idx]
      const upvotes_count = idToCount.get(p.id) || 0
      const has_upvoted = walletLower ? userUpvotes.has(p.id) : false
      return { ...p, owner, upvotes_count, has_upvoted }
    })

    return results
  }

  export async function upvoteProject(projectId: number, voterWallet: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("project_upvotes")
      .insert({ project_id: projectId, voter_wallet_address: voterWallet.toLowerCase() })
    // ignore duplicate upvotes (unique constraint)
    if (error && error.code !== "23505") throw error
    // on-chain mocked; Supabase is source of truth in demo
  }

  export async function removeUpvote(projectId: number, voterWallet: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("project_upvotes")
      .delete()
      .eq("project_id", projectId)
      .eq("voter_wallet_address", voterWallet.toLowerCase())
    if (error) throw error
  }

  export async function updateProject(projectId: number, updates: { name?: string; description_md?: string }): Promise<Project> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates })
      .eq("id", projectId)
      .select()
      .single()
    if (error) throw error
    return data as Project
  }

  export async function deleteProject(projectId: number): Promise<void> {
    const supabase = createClient()
    // on-chain mocked; proceed with DB delete
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
    if (error) throw error
  }

  export async function addDonationsToProjectsSplits(splits: Array<{ id: number; amountUsd: number }>): Promise<void> {
    if (!splits.length) return
    const supabase = createClient()
    for (const s of splits) {
      const { error } = await supabase.rpc("increment_project_donated", { p_id: s.id, p_amount: s.amountUsd })
      if (error) {
        // fallback if rpc not present: update inline
        const { data: row } = await supabase.from("projects").select("donated_amount_usd").eq("id", s.id).single()
        const cur = Number((row as any)?.donated_amount_usd || 0)
        const { error: upErr } = await supabase
          .from("projects")
          .update({ donated_amount_usd: cur + s.amountUsd })
          .eq("id", s.id)
        if (upErr) throw upErr
      }
    }
  }

  export async function getTotalDonatedUsd(): Promise<number> {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").select("donated_amount_usd")
    if (error) throw error
    return (data as any[]).reduce((s, r) => s + Number(r.donated_amount_usd || 0), 0)
  }

  export async function getProjectDonatedUsd(projectId: number): Promise<number> {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").select("donated_amount_usd").eq("id", projectId).single()
    if (error) throw error
    return Number((data as any)?.donated_amount_usd || 0)
  }

  export async function withdrawDonations(projectId: number, toWallet: string): Promise<void> {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").select("donated_amount_usd").eq("id", projectId).single()
    if (error) throw error
    const amtUsd = Number((data as any)?.donated_amount_usd || 0)
    // zero out the project's donated amount
    const { error: upErr } = await supabase.from("projects").update({ donated_amount_usd: 0 }).eq("id", projectId)
    if (upErr) throw upErr
    // credit the owner's wallet balance in mock usdc
    if (amtUsd > 0) {
      const key = `mock:usdc:${toWallet.toLowerCase()}`
      const cur = BigInt((typeof window !== "undefined" ? window.localStorage.getItem(key) : null) || "0")
      const delta = BigInt(Math.round(amtUsd * 1e6))
      if (typeof window !== "undefined") window.localStorage.setItem(key, (cur + delta).toString())
    }
  }

  export async function withdrawAllForOwner(ownerWallet: string): Promise<void> {
    const supabase = createClient()
    const lower = ownerWallet.toLowerCase()
    const { data, error } = await supabase.from("projects").select("id, donated_amount_usd, owner_wallet_address").eq("owner_wallet_address", lower)
    if (error) throw error
    const rows = (data as any[]) || []
    let totalUsd = 0
    for (const r of rows) {
      const amt = Number(r.donated_amount_usd || 0)
      if (amt > 0) {
        totalUsd += amt
        await supabase.from("projects").update({ donated_amount_usd: 0 }).eq("id", r.id)
      }
    }
    if (totalUsd > 0) {
      const key = `mock:usdc:${lower}`
      const cur = BigInt((typeof window !== "undefined" ? window.localStorage.getItem(key) : null) || "0")
      const delta = BigInt(Math.round(totalUsd * 1e6))
      if (typeof window !== "undefined") window.localStorage.setItem(key, (cur + delta).toString())
    }
  }
}


