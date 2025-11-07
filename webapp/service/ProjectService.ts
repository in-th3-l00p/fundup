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

  export async function listProjects(query?: string): Promise<ProjectWithOwner[]> {
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
    const results: ProjectWithOwner[] = []
    for (const p of rows) {
      let owner: Profile | null = null
      try {
        owner = await ProfileService.getOrCreateProfile(p.owner_wallet_address)
      } catch {
        owner = null
      }
      results.push({ ...p, owner })
    }
    return results
  }
}


