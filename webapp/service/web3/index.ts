"use client"

import { Address, createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem"
import { foundry } from "viem/chains"

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
const USDC = (process.env.NEXT_PUBLIC_USDC || "") as Address
const TWYNE_VAULT = (process.env.NEXT_PUBLIC_TWYNE_VAULT || "") as Address
const DONATION_SPLITTER = (process.env.NEXT_PUBLIC_DONATION_SPLITTER || "") as Address

const erc20Abi = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const

const vaultAbi = [
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToAssets", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const

const splitterAbi = [
  { type: "function", name: "numProjects", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "projects", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }, { type: "bool" }] },
  { type: "function", name: "currentVotes", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "distribute", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [] },
] as const

function publicClient() {
  return createPublicClient({ chain: foundry, transport: http(RPC_URL) })
}

async function walletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) throw new Error("no wallet")
  return createWalletClient({ chain: foundry, transport: custom((window as any).ethereum) })
}

export const Web3 = {
  addresses: { usdc: USDC, twyneVault: TWYNE_VAULT, donationSplitter: DONATION_SPLITTER },
  async getUsdcDecimals(): Promise<number> {
    const pc = publicClient()
    const dec = await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "decimals" })
    return Number(dec)
  },
  async getTokenBalance(token: Address, holder: Address): Promise<bigint> {
    const pc = publicClient()
    return await pc.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [holder] })
  },
  async getUsdcBalance(user: Address): Promise<bigint> {
    const pc = publicClient()
    return await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [user] })
  },
  async getTotalDonatedUsdc(): Promise<bigint> {
    if (!DONATION_SPLITTER) return 0n
    const pc = publicClient()
    return await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [DONATION_SPLITTER] })
  },
  async listProjects(): Promise<Array<{ id: number; recipient: Address; active: boolean; votes: bigint }>> {
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
  },
  async transferUsdc(user: Address, to: Address, amount: bigint) {
    const pc = publicClient()
    const wc = await walletClient()
    const hash = await wc.writeContract({ account: user, address: USDC, abi: erc20Abi, functionName: "transfer", args: [to, amount] })
    await pc.waitForTransactionReceipt({ hash })
  },
  async distribute() {
    if (!DONATION_SPLITTER) return
    const pc = publicClient()
    const wc = await walletClient()
    const accounts = await wc.getAddresses()
    const account = accounts[0]
    const hash = await wc.writeContract({ account, address: DONATION_SPLITTER, abi: splitterAbi, functionName: "distribute", args: [USDC] })
    await pc.waitForTransactionReceipt({ hash })
  },
  async getVaultShares(user: Address): Promise<bigint> {
    const pc = publicClient()
    return await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "balanceOf", args: [user] })
  },
  async getVaultAssets(user: Address): Promise<bigint> {
    const pc = publicClient()
    const shares = await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "balanceOf", args: [user] })
    return await pc.readContract({ address: TWYNE_VAULT, abi: vaultAbi, functionName: "convertToAssets", args: [shares] })
  },
  async approveUsdcIfNeeded(user: Address, spender: Address, amount: bigint) {
    const pc = publicClient()
    const allowance = await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "allowance", args: [user, spender] })
    if (allowance >= amount) return
    const wc = await walletClient()
    const hash = await wc.writeContract({ account: user, address: USDC, abi: erc20Abi, functionName: "approve", args: [spender, amount] })
    await pc.waitForTransactionReceipt({ hash })
  },
  async depositToVault(user: Address, assets: bigint) {
    const pc = publicClient()
    const wc = await walletClient()
    await Web3.approveUsdcIfNeeded(user, TWYNE_VAULT, assets)
    const hash = await wc.writeContract({ account: user, address: TWYNE_VAULT, abi: vaultAbi, functionName: "deposit", args: [assets, user] })
    await pc.waitForTransactionReceipt({ hash })
  },
  format(amount: bigint, decimals: number) {
    return formatUnits(amount, decimals)
  },
  parse(amount: string, decimals: number) {
    return parseUnits(amount || "0", decimals)
  },
}


