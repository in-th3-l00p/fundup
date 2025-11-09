import { formatUnits, parseUnits } from "viem"

export function format(amount: bigint, decimals: number) {
  return formatUnits(amount, decimals)
}

export function parse(amount: string, decimals: number) {
  return parseUnits(amount || "0", decimals)
}


