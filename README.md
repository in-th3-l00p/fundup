## fundup — octant v2 yield-donating vaults, powered by twyne

deposit once. keep principal. route yield to public goods chosen by capital‑weighted votes.

### tech
- solidity 0.8.24 + foundry (forge/cast)
- octant v2 erc‑4626 vault + yield‑donating strategy pattern
- twyne credit delegation (~11% apy target), simulated for dev
- next.js + typescript + wagmi + viem + rainbowkit
- tailwind & shadcn 4 ui

### features
- erc‑4626 deposits/withdrawals (users hold principal)
- yield donated to a configurable split (donation address)
- cause registry: anyone can publish a funding cause (onchain metadata)
- voting: up/down votes weighted by vault shares
- eligibility: >= 10% net upvotes of total voting power
- allocation: per‑epoch split among eligible causes, proportional to net upvotes
- live views: tvl, apy, epoch timer, allocations, impact history
- safety: strategy caps, pause/guards, bounded external calls
- testing: foundry unit/fork tests; twyne vault + manager mocks

### app flow
- connect wallet
- pick a vault, deposit asset (e.g., usdc)
- publish a cause (recipient + metadata) or browse existing
- vote up/down; voting power = your vault shares
- epoch rollover
  - snapshot shares
  - check eligibility (>= 10% net upvotes)
  - compute weights and update donation splitter
- harvests route yield to the donation address; splitter auto‑sends to causes
- withdraw principal anytime; your voting power adjusts next epoch
- see live metrics (tvl, apy, next epoch) and distribution history



