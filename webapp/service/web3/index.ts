"use client"

import { Address, createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem"
import { foundry } from "viem/chains"

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
const USDC = (process.env.NEXT_PUBLIC_USDC || "") as Address
const TWYNE_VAULT = (process.env.NEXT_PUBLIC_TWYNE_VAULT || "") as Address

const erc20Abi = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const

const vaultAbi = [
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToAssets", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const

function publicClient() {
  return createPublicClient({ chain: foundry, transport: http(RPC_URL) })
}

async function walletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) throw new Error("no wallet")
  return createWalletClient({ chain: foundry, transport: custom((window as any).ethereum) })
}

export const Web3 = {
  addresses: { usdc: USDC, twyneVault: TWYNE_VAULT },
  async getUsdcDecimals(): Promise<number> {
    const pc = publicClient()
    const dec = await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "decimals" })
    return Number(dec)
  },
  async getUsdcBalance(user: Address): Promise<bigint> {
    const pc = publicClient()
    return await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [user] })
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


