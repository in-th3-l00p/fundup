import { createClient } from "@/utils/supabase/client"

export type Profile = {
  wallet_address: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at?: string
  updated_at?: string
}

function shortName(addr: string) {
  if (!addr) return ""
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

export namespace ProfileService {
  export async function getOrCreateProfile(walletAddress: string): Promise<Profile> {
    const supabase = createClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("wallet_address, display_name, avatar_url, bio, created_at, updated_at")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    if (profile) return profile as Profile

    const defaultProfile: Profile = {
      wallet_address: walletAddress.toLowerCase(),
      display_name: shortName(walletAddress),
      avatar_url: null,
      bio: "",
    }

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert(defaultProfile)
      .select()
      .single()

    if (insertError) throw insertError
    return inserted as Profile
  }

  export async function updateProfile(walletAddress: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates })
      .eq("wallet_address", walletAddress.toLowerCase())
      .select()
      .single()
    if (error) throw error
    return data as Profile
  }

  export async function deleteProfile(walletAddress: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("wallet_address", walletAddress.toLowerCase())
    if (error) throw error
  }
}


