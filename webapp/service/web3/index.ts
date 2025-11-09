"use client"

import type { Address } from "viem"
import { addresses, DONATION_SPLITTER, TWYNE_VAULT, USDC } from "./addresses"
import { getTokenDecimals, getUsdcDecimals, getTokenBalance, getUsdcBalance, getTotalDonatedUsdc, listProjects, getVaultShares, getVaultAssets } from "./reads"
import { approveUsdcIfNeeded, depositToVault, distribute, transferUsdc, splitterAddProject, splitterSetProjectActive, splitterUpvote, splitterAdvanceEpoch } from "./writes"
import { format, parse } from "./format"

const erc20 = {
  getDecimals: getTokenDecimals,
  getBalance: getTokenBalance,
}

const usdc = {
  getDecimals: getUsdcDecimals,
  getBalance: getUsdcBalance,
  transfer: transferUsdc,
  approveIfNeeded: approveUsdcIfNeeded,
}

const vault = {
  getShares: getVaultShares,
  getAssets: getVaultAssets,
  deposit: depositToVault,
}

const splitter = {
  listProjects,
  distribute,
  getUsdcBalance: getTotalDonatedUsdc,
  addProject: splitterAddProject,
  setProjectActive: splitterSetProjectActive,
  upvote: splitterUpvote,
  advanceEpoch: splitterAdvanceEpoch,
}

export const Web3 = {
  addresses,
  erc20,
  usdc,
  vault,
  splitter,
  format,
  parse,
}

export {
  addresses,
  USDC,
  TWYNE_VAULT,
  DONATION_SPLITTER,
  erc20,
  usdc,
  vault,
  splitter,
  format,
  parse,
}

