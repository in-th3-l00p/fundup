#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="/Users/intheloop/Desktop/fundup"
CONTRACTS="$ROOT/contracts"
WEBAPP="$ROOT/webapp"
ENV_FILE="$WEBAPP/.env"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
CHAIN_ID="${CHAIN_ID:-31337}"
PK="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
ADDR="${FROM:-0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266}"

need() { command -v "$1" >/dev/null || { echo "missing $1"; exit 1; }; }
is_up() { cast chain-id --rpc-url "$RPC_URL" >/dev/null 2>&1; }

start_anvil() {
  if is_up; then
    echo "anvil already running at $RPC_URL"
    return
  fi
  echo "Starting anvil on $RPC_URL (chain-id $CHAIN_ID)..."
  anvil --chain-id "$CHAIN_ID" --silent >/dev/null 2>&1 &
  ANVIL_PID=$!
  echo "$ANVIL_PID" > "$ROOT/.anvil.pid"
  # wait ready
  for _ in {1..50}; do is_up && break || sleep 0.1; done
  is_up || { echo "anvil did not start"; exit 1; }
}

forge_create() {
  local target="$1"; shift
  if out=$(cd "$CONTRACTS" && forge create "$target" --rpc-url "$RPC_URL" --private-key "$PK" --broadcast --constructor-args "$@" 2>/dev/null); then
    echo "$out"
    return 0
  fi
  if out=$(cd "$CONTRACTS" && forge create "$target" --rpc-url "$RPC_URL" --unlocked --from "$ADDR" --broadcast --constructor-args "$@" 2>/dev/null); then
    echo "$out"
    return 0
  fi
  return 1
}

deploy() {
  echo "Building contracts..."
  (cd "$CONTRACTS" && forge build >/dev/null)

  echo "Deploying MintableERC20 (USDC, 6d)..."
  local out
  out=$(forge_create src/mocks/MintableERC20.sol:MintableERC20 "USD Coin" "USDC" 6 "$ADDR") || { echo "deploy USDC failed"; exit 1; }
  USDC=$(echo "$out" | awk '/Deployed to:/ {print $3}')
  echo "  USDC @ $USDC"

  echo "Deploying MockTwyneCreditVault (APR 11%)..."
  out=$(forge_create src/twyne/mocks/MockTwyneCreditVault.sol:MockTwyneCreditVault "$USDC" 1100) || { echo "deploy vault failed"; exit 1; }
  TWYNE_VAULT=$(echo "$out" | awk '/Deployed to:/ {print $3}')
  echo "  TwyneVault @ $TWYNE_VAULT"

  echo "Deploying ProjectsUpvoteSplitter..."
  out=$(forge_create src/donations/ProjectsUpvoteSplitter.sol:ProjectsUpvoteSplitter "$ADDR") || { echo "deploy splitter failed"; exit 1; }
  SPLITTER=$(echo "$out" | awk '/Deployed to:/ {print $3}')
  echo "  Splitter @ $SPLITTER"

  echo "Deploying TwyneYieldDonatingStrategy..."
  out=$(forge_create src/strategy/TwyneYieldDonatingStrategy.sol:TwyneYieldDonatingStrategy \
    "$TWYNE_VAULT" "$USDC" "Twyne YDS" "$ADDR" "$ADDR" "$ADDR" "$SPLITTER" true 0x0000000000000000000000000000000000000000) || { echo "deploy strategy failed"; exit 1; }
  STRATEGY=$(echo "$out" | awk '/Deployed to:/ {print $3}')
  echo "  Strategy @ $STRATEGY"
}

write_env() {
  mkdir -p "$WEBAPP"
  touch "$ENV_FILE"
  echo "Updating $ENV_FILE"

  set_kv() {
    # set_kv KEY VALUE  (replace line starting with KEY=... or append if missing)
    local key="$1"
    local val="$2"
    awk -v k="$key" -v v="$val" '
      BEGIN { done=0 }
      # Replace first occurrence of the key
      $0 ~ ("^" k "=") && done==0 { print k "=" v; done=1; next }
      { print }
      END { if (done==0) print k "=" v }
    ' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  }

  set_kv "NEXT_PUBLIC_RPC_URL" "$RPC_URL"
  set_kv "NEXT_PUBLIC_CHAIN_ID" "$CHAIN_ID"
  set_kv "NEXT_PUBLIC_USDC" "$USDC"
  set_kv "NEXT_PUBLIC_TWYNE_VAULT" "$TWYNE_VAULT"
  set_kv "NEXT_PUBLIC_YDS_STRATEGY" "$STRATEGY"
  set_kv "NEXT_PUBLIC_DONATION_SPLITTER" "$SPLITTER"
  # test wallets (pre-funded + minted)
  set_kv "TEST_WALLET1_ADDRESS" "${WAL_ADDRS[0]}"
  set_kv "TEST_WALLET1_PRIVATE_KEY" "${WAL_PKS[0]}"
  set_kv "TEST_WALLET2_ADDRESS" "${WAL_ADDRS[1]}"
  set_kv "TEST_WALLET2_PRIVATE_KEY" "${WAL_PKS[1]}"
  set_kv "TEST_WALLET3_ADDRESS" "${WAL_ADDRS[2]}"
  set_kv "TEST_WALLET3_PRIVATE_KEY" "${WAL_PKS[2]}"
}

main() {
  need anvil; need forge; need cast; need awk
  start_anvil
  deploy
  # create 3 demo wallets, fund with ETH and mint USDC
  WAL_ADDRS=()
  WAL_PKS=()
  for i in 1 2 3; do
    json=$(cast wallet new --json)
    pk=$(python3 - <<'PY' "$json"
import sys, json
d = json.loads(sys.argv[1])
if isinstance(d, list) and len(d) > 0:
    d = d[0]
print(d.get("privateKey") or d.get("private_key") or d.get("privatekey"))
PY
)
    addr=$(python3 - <<'PY' "$json"
import sys, json
d = json.loads(sys.argv[1])
if isinstance(d, list) and len(d) > 0:
    d = d[0]
print(d.get("address"))
PY
)
    # fund 10 ETH
    cast send "$addr" --value 10000000000000000000 --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null
    # mint 100,000 USDC (6d)
    cast send "$USDC" "mint(address,uint256)" "$addr" 100000000000 --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null
    WAL_ADDRS+=("$addr")
    WAL_PKS+=("$pk")
  done
  # also mint to deployer/default anvil account so a common wallet has USDC
  cast send "$USDC" "mint(address,uint256)" "$ADDR" 100000000000 --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null
  write_env
  echo ""
  echo "Devnet ready."
  echo "RPC: $RPC_URL (chain-id $CHAIN_ID)"
  echo "USDC=$USDC"
  echo "TWYNE_VAULT=$TWYNE_VAULT"
  echo "YDS_STRATEGY=$STRATEGY"
  echo "DONATION_SPLITTER=$SPLITTER"
  echo "Wallets (pre-funded + minted USDC):"
  echo "  W1: ${WAL_ADDRS[0]}  pk=${WAL_PKS[0]}"
  echo "  W2: ${WAL_ADDRS[1]}  pk=${WAL_PKS[1]}"
  echo "  W3: ${WAL_ADDRS[2]}  pk=${WAL_PKS[2]}"
  echo ""
  echo "Env written to $ENV_FILE"
}

main


