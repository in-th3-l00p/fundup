export const erc20Abi = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const

export const vaultAbi = [
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToAssets", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const

export const splitterAbi = [
  { type: "function", name: "numProjects", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "projects", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }, { type: "bool" }] },
  { type: "function", name: "currentVotes", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "addProject", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "setProjectActive", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "bool" }], outputs: [] },
  { type: "function", name: "upvote", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "advanceEpoch", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "distribute", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [] },
] as const


