import type { Address } from "viem"
import { publicClient } from "./clients"
import { erc20Abi, splitterAbi, vaultAbi } from "./abis"
import { DONATION_SPLITTER, TWYNE_VAULT, USDC } from "./addresses"

export async function getTokenDecimals(token: Address): Promise<number> {
  const pc = publicClient()
  const dec = await pc.readContract({ address: token, abi: erc20Abi, functionName: "decimals" })
  return Number(dec)
}

export async function getUsdcDecimals(): Promise<number> {
  const pc = publicClient()
  const dec = await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "decimals" })
  return Number(dec)
}

export async function getTokenBalance(token: Address, holder: Address): Promise<bigint> {
  const pc = publicClient()
  return await pc.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [holder] })
}

export async function getUsdcBalance(user: Address): Promise<bigint> {
  const pc = publicClient()
  return await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [user] })
}

export async function getTotalDonatedUsdc(): Promise<bigint> {
  if (!DONATION_SPLITTER) return 0n
  const pc = publicClient()
  return await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [DONATION_SPLITTER] })
}

export async function listProjects(): Promise<Array<{ id: number; recipient: Address; active: boolean; votes: bigint }>> {
  if (!DONATION_SPLITTER) return []
  const pc = publicClient()
  const n = await pc.readContract({ address: DONATION_SPLITTER, abi: splitterAbi, functionName: "numProjects" }) as bigint
  const out: Array<{ id: number; recipient: Address; active: boolean; votes: bigint }> = []
  const count = Number(n)
  for (let i = 0; i < count; i++) {
    const proj = await pc.readContract({ address: DONATION_SPLITTER, abi: splitterAbi, functionName: "projects", args: [BigInt(i)] }) as readonly [Address, boolean]
    const v = await pc.readContract({ address: DONATION_SPLITTER, abi: splitterAbi, functionName: "currentVotes", args: [BigInt(i)] }) as bigint
    out.push({ id: i, recipient: proj[0], active: proj[1], votes: v })
  }
  return out
}

export async function getVaultShares(user: Address): Promise<bigint> {
  const pc = publicClient()
  return await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "balanceOf", args: [user] })
}

export async function getVaultAssets(user: Address): Promise<bigint> {
  const pc = publicClient()
  const shares = await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "balanceOf", args: [user] })
  return await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "convertToAssets", args: [shares] })
}


