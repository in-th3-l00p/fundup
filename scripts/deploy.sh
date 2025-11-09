#!/usr/bin/env bash
set -euo pipefail

# FundUp local deploy script:
# - Starts anvil
# - Deploys mock USDC (MintableERC20, 6 decimals)
# - Deploys MockTwyneCreditVault (ERC-4626-like) with USDC as asset
# - Deploys ProjectsUpvoteSplitter
# - Mints USDC to test wallets
# - Funds test wallets with ETH
# - Writes Next.js .env with required addresses and vars
#
# Requirements: foundry (anvil/forge/cast) installed and on PATH.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="${NEXT_PUBLIC_RPC_URL:-http://127.0.0.1:8545}"
CHAIN_ID="${NEXT_PUBLIC_CHAIN_ID:-31337}"
WEBAPP_ENV="${ROOT_DIR}/webapp/.env"

# Enable verbose tracing if DEBUG is set
if [[ -n "${DEBUG:-}" ]]; then
  set -x
fi

# Use known Anvil default deployer unless provided
# Default to Account #0 (addr 0xf39F..., pk 0xac09...) so owner matches deployer
DEPLOYER_PK="${DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
DEPLOYER_ADDR="${DEPLOYER_ADDR:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"

# Test wallets to fund
WALLET1="${WALLET1:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
WALLET2="${WALLET2:-0x70997970c51812dc3a010c7d01b50e0d17dc79c8}"

function log() { echo "[$(date +'%H:%M:%S')] $*"; }

function start_anvil() {
  if nc -z 127.0.0.1 8545 >/dev/null 2>&1; then
    log "anvil already running at ${RPC_URL}"
    return
  fi
  log "starting anvil..."
  anvil --chain-id "${CHAIN_ID}" --port 8545 --host 127.0.0.1 --silent >/tmp/anvil.log 2>&1 &
  ANVIL_PID=$!
  # wait for JSON-RPC to be ready
  for i in {1..30}; do
    if nc -z 127.0.0.1 8545 >/dev/null 2>&1; then
      log "anvil is up (pid ${ANVIL_PID})"
      break
    fi
    sleep 0.3
  done
}

function forge_build() {
  log "forge build..."
  (cd "${ROOT_DIR}/contracts" && forge build)
}

function deploy_contract() {
  local fqcn="$1"; shift
  local out addr
  out=$(cd "${ROOT_DIR}/contracts" && forge create \
    --rpc-url "${RPC_URL}" \
    --private-key "${DEPLOYER_PK}" \
    --broadcast \
    --json \
    "${fqcn}" \
    "$@" 2>&1)
  # Extract address from JSON
  addr=$(echo "${out}" | sed -nE 's/.*"deployedTo":[[:space:]]*"([^"]+)".*/\1/p' | tail -n1 || true)
  echo "${addr}"
}

function send_eth() {
  local to="$1"
  local value_wei="$2"
  cast send --rpc-url "${RPC_URL}" --private-key "${DEPLOYER_PK}" "${to}" --value "${value_wei}"
}

function send_tx() {
  local to="$1"; shift
  local sig="$1"; shift
  local args=("$@")
  cast send --rpc-url "${RPC_URL}" --private-key "${DEPLOYER_PK}" "${to}" "${sig}" "${args[@]}"
}

start_anvil
forge_build

log "deploying USDC (MintableERC20, 6 decimals)..."
USDC_ADDR=$(deploy_contract "src/mocks/MintableERC20.sol:MintableERC20" --constructor-args "USD Coin" "USDC" 6 "${DEPLOYER_ADDR}")
if [[ -z "${USDC_ADDR}" ]]; then
  echo "Failed to deploy USDC" >&2
  exit 1
fi
log "USDC deployed at ${USDC_ADDR}"

log "deploying MockTwyneCreditVault (asset=USDC, rate=11% APR)..."
# annualRateBps = 1100
TWYNE_VAULT_ADDR=$(deploy_contract "src/twyne/mocks/MockTwyneCreditVault.sol:MockTwyneCreditVault" --constructor-args "${USDC_ADDR}" 1100)
if [[ -z "${TWYNE_VAULT_ADDR}" ]]; then
  echo "Failed to deploy MockTwyneCreditVault" >&2
  exit 1
fi
log "MockTwyneCreditVault deployed at ${TWYNE_VAULT_ADDR}"

log "deploying ProjectsUpvoteSplitter..."
SPLITTER_ADDR=$(deploy_contract "src/donations/ProjectsUpvoteSplitter.sol:ProjectsUpvoteSplitter")
if [[ -z "${SPLITTER_ADDR}" ]]; then
  echo "Failed to deploy ProjectsUpvoteSplitter" >&2
  exit 1
fi
log "ProjectsUpvoteSplitter deployed at ${SPLITTER_ADDR}"

# Fund wallets with ETH (optional top-up) and USDC
log "funding wallets with ETH..."
# 100 ETH each
ETH_AMOUNT_WEI=$(cast --to-wei 100 ether)
send_eth "${WALLET1}" "${ETH_AMOUNT_WEI}"
send_eth "${WALLET2}" "${ETH_AMOUNT_WEI}"

log "minting USDC to wallets..."
# 1,000,000 USDC with 6 decimals = 1_000_000 * 10^6
USDC_MINT_AMT="1000000000000"
send_tx "${USDC_ADDR}" "mint(address,uint256)" "${WALLET1}" "${USDC_MINT_AMT}"
send_tx "${USDC_ADDR}" "mint(address,uint256)" "${WALLET2}" "${USDC_MINT_AMT}"

log "writing Next.js env to ${WEBAPP_ENV}..."
mkdir -p "$(dirname "${WEBAPP_ENV}")"
cat > "${WEBAPP_ENV}" <<EOF
NEXT_PUBLIC_RPC_URL=${RPC_URL}
NEXT_PUBLIC_CHAIN_ID=${CHAIN_ID}
NEXT_PUBLIC_USDC=${USDC_ADDR}
NEXT_PUBLIC_TWYNE_VAULT=${TWYNE_VAULT_ADDR}
NEXT_PUBLIC_DONATION_SPLITTER=${SPLITTER_ADDR}
NEXT_PUBLIC_SPLITTER_OWNER_PK=${DEPLOYER_PK}
EOF

log "done."
log "Addresses:"
log " USDC                 : ${USDC_ADDR}"
log " MockTwyneCreditVault : ${TWYNE_VAULT_ADDR}"
log " Splitter             : ${SPLITTER_ADDR}"
log " Deployer             : ${DEPLOYER_ADDR}"
log " Funded wallets       : ${WALLET1}, ${WALLET2}"


