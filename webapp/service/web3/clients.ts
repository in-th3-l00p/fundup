"use client"

import { createPublicClient, createWalletClient, custom, http } from "viem"
import { foundry } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
const OWNER_PK = process.env.NEXT_PUBLIC_SPLITTER_OWNER_PK

export function publicClient() {
  return createPublicClient({ chain: foundry, transport: http(RPC_URL) })
}

export async function walletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) throw new Error("no wallet")
  return createWalletClient({ chain: foundry, transport: custom((window as any).ethereum) })
}

export function ownerWalletClient() {
  if (!OWNER_PK) throw new Error("missing owner pk")
  const account = privateKeyToAccount(OWNER_PK as `0x${string}`)
  return createWalletClient({ account, chain: foundry, transport: http(RPC_URL) })
}


