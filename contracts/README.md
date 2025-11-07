 # Contracts Workspace

 This Foundry workspace contains a lightweight simulation of Twyne components for integrating and testing an Octant v2 Yield-Donating Strategy (YDS).

 References:
 - Twyne developer docs (Contracts): https://twyne.gitbook.io/twyne/for-developers/contracts
 - Octant v2 docs (Introduction): https://docs.v2.octant.build/docs/introduction

 ## Structure
 - `src/mocks/MockERC20.sol` – simple ERC20 for local testing.
 - `src/twyne/interfaces/*` – minimal interfaces for Twyne-like components.
 - `src/twyne/mocks/MockTwyneCreditVault.sol` – ERC-4626-like credit vault simulation with APR accrual.
 - `src/twyne/mocks/MockTwyneVaultManager.sol` – delegation registry (lender → borrower) for simulation.

 ## Simulation model
 Based on Twyne docs, core components include a Credit Vault, Collateral Vault(s), a Vault Manager, and an Interest Rate Model. For hackathon integration testing, we simulate the **Credit Vault** and **Vault Manager** with the following behavior:

 - Credit Vault (ERC-4626-like):
   - `deposit(assets, receiver)` mints shares at the current `exchangeRate` (1e18 = 1:1 initially).
   - `withdraw(assets, receiver, owner)` burns the corresponding shares and transfers underlying.
   - `accrueInterest()` updates `exchangeRate` using a linear APR approximation from `annualRateBps`.
   - `setAnnualRateBps()` allows adjusting APR (e.g., 1100 for ~11%).
   - `setManager()` configures a manager address (for delegation simulation only).

 - Vault Manager:
   - `delegateBorrowingPower(lender, borrower, assets)` records a delegation amount.
   - `revokeDelegation(lender, borrower)` clears the delegation.

 This is sufficient to emulate Twyne's yield behavior and delegation surfaces needed by an Octant strategy that deploys funds into the vault, realizes profits via `accrueInterest()`, and later routes yield to a donation address per Octant YDS mechanics.

 ## Next steps
 - Implement an Octant-compatible Yield-Donating Strategy that deploys into `MockTwyneCreditVault`.
 - Wire into a Vault (ERC-4626) with donation address set to a dynamic splitter for per-epoch distributions.


