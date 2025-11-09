/* Mocked chain interactions for demo – replaces on-chain calls with localStorage + Supabase data */
import type { Address } from "viem"
import { ProjectService } from "@/service/ProjectService"

const DECIMALS = 6
const DONATION_SPLITTER = "0x0000000000000000000000000000000000000001" as Address

function getLs(key: string, fallback: string = "0") {
  if (typeof window === "undefined") return fallback
  return window.localStorage.getItem(key) ?? fallback
}
function setLs(key: string, val: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, val)
}

export function format(amount: bigint, decimals = DECIMALS): string {
  const neg = amount < 0n
  const n = neg ? -amount : amount
  const s = n.toString().padStart(decimals + 1, "0")
  const int = s.slice(0, -decimals)
  const frac = s.slice(-decimals).replace(/0+$/, "")
  const out = frac.length ? `${int}.${frac}` : int
  return neg ? `-${out}` : out
}

export function parse(str: string, decimals = DECIMALS): bigint {
  const [i, f = ""] = (str || "0").split(".")
  const frac = (f + "0".repeat(decimals)).slice(0, decimals)
  const s = i + frac
  return BigInt(s || "0")
}

const usdc = {
  getDecimals: async () => DECIMALS,
  getBalance: async (user: Address) => {
    const key = `mock:usdc:${user.toLowerCase()}`
    return BigInt(getLs(key, (5_000 * 10 ** DECIMALS).toString()))
  },
  /* transfer only used for donating to splitter in this app */
  transfer: async (from: Address, to: Address, amount: bigint) => {
    const fromKey = `mock:usdc:${from.toLowerCase()}`
    const bal = BigInt(getLs(fromKey, "0"))
    setLs(fromKey, (bal - amount).toString())
    if (to === DONATION_SPLITTER) {
      const sKey = `mock:splitter:balance`
      const cur = BigInt(getLs(sKey, "0"))
      setLs(sKey, (cur + amount).toString())
    }
  },
}

const vault = {
  getAssets: async (user: Address) => {
    const key = `mock:vault:${user.toLowerCase()}`
    return BigInt(getLs(key, "0"))
  },
  deposit: async (user: Address, assets: bigint) => {
    const wKey = `mock:usdc:${user.toLowerCase()}`
    const vKey = `mock:vault:${user.toLowerCase()}`
    const w = BigInt(getLs(wKey, "0"))
    const v = BigInt(getLs(vKey, "0"))
    setLs(wKey, (w - assets).toString())
    setLs(vKey, (v + assets).toString())
  },
}

const splitter = {
  getUsdcBalance: async () => {
    return BigInt(getLs(`mock:splitter:balance`, "0"))
  },
  listProjects: async (): Promise<Array<{ id: number; recipient: Address; active: boolean; votes: bigint }>> => {
    const rows = await ProjectService.listProjects()
    return rows.map((r) => ({
      id: r.id,
      recipient: r.owner_wallet_address as Address,
      active: true,
      votes: BigInt(r.upvotes_count || 0),
    }))
  },
  distribute: async () => {
    // send out all current balance; for demo we just zero it out
    setLs(`mock:splitter:balance`, "0")
  },
}

export const MockChain = {
  addresses: { donationSplitter: DONATION_SPLITTER },
  usdc,
  vault,
  splitter,
  format,
  parse,
}


