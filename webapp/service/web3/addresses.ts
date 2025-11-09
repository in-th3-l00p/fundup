import type { Address } from "viem"

export const USDC = (process.env.NEXT_PUBLIC_USDC || "") as Address
export const TWYNE_VAULT = (process.env.NEXT_PUBLIC_TWYNE_VAULT || "") as Address
export const DONATION_SPLITTER = (process.env.NEXT_PUBLIC_DONATION_SPLITTER || "") as Address

export const addresses = {
  usdc: USDC,
  twyneVault: TWYNE_VAULT,
  donationSplitter: DONATION_SPLITTER,
}


