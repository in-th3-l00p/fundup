import { createClient } from "@/utils/supabase/client"
import { ProfileService, type Profile } from "@/service/ProfileService"

export type Project = {
  id: number
  owner_wallet_address: string
  name: string
  description_md: string
  created_at?: string
  updated_at?: string
}

export type ProjectWithOwner = Project & { owner?: Profile | null }
export type ProjectWithMeta = ProjectWithOwner & { upvotes_count: number; has_upvoted: boolean }

export namespace ProjectService {
  export async function createProject(ownerWallet: string, name: string, description_md: string): Promise<Project> {
    const supabase = createClient()
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
      .select("id, owner_wallet_address, name, description_md, created_at, updated_at")
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
  }
}


