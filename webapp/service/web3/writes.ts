import type { Address } from "viem"
import { publicClient, walletClient } from "./clients"
import { erc20Abi, splitterAbi, vaultAbi } from "./abis"
import { DONATION_SPLITTER, TWYNE_VAULT, USDC } from "./addresses"

export async function transferUsdc(user: Address, to: Address, amount: bigint) {
  const pc = publicClient()
  const wc = await walletClient()
  const hash = await wc.writeContract({ account: user, address: USDC, abi: erc20Abi, functionName: "transfer", args: [to, amount] })
  await pc.waitForTransactionReceipt({ hash })
}

export async function distribute() {
  if (!DONATION_SPLITTER) return
  const pc = publicClient()
  const wc = await walletClient()
  const accounts = await wc.getAddresses()
  const account = accounts[0]
  const hash = await wc.writeContract({ account, address: DONATION_SPLITTER, abi: splitterAbi, functionName: "distribute", args: [USDC] })
  await pc.waitForTransactionReceipt({ hash })
}

export async function approveUsdcIfNeeded(user: Address, spender: Address, amount: bigint) {
  const pc = publicClient()
  const allowance = await pc.readContract({ address: USDC, abi: erc20Abi, functionName: "allowance", args: [user, spender] })
  if (allowance >= amount) return
  const wc = await walletClient()
  const hash = await wc.writeContract({ account: user, address: USDC, abi: erc20Abi, functionName: "approve", args: [spender, amount] })
  await pc.waitForTransactionReceipt({ hash })
}

export async function depositToVault(user: Address, assets: bigint) {
  const pc = publicClient()
  const wc = await walletClient()
  await approveUsdcIfNeeded(user, TWYNE_VAULT, assets)
  const hash = await wc.writeContract({ account: user, address: TWYNE_VAULT, abi: vaultAbi, functionName: "deposit", args: [assets, user] })
  await pc.waitForTransactionReceipt({ hash })
}


