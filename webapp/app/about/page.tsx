import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black">
      <main className="w-full max-w-2xl px-6 py-24 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">about fundup</h1>
          <p className="text-sm text-black/60">yield-donating app powered by a Twyne credit vault and Octant v2 strategy primitives.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">what it is</h2>
          <p className="text-black/70">
            fundup lets you deposit USDC into a vault that generates yield. Your principal stays yours, and the yield
            is donated to on-chain projects you collectively upvote. Projects register an on-chain recipient and receive
            donations proportionally to votes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">how it works</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>Deposit USDC to a Twyne-like credit vault (ERC-4626). Shares accrue yield over time.</li>
            <li>Your principal is tracked locally; your yield equals vault assets minus principal.</li>
            <li>Donate flow transfers your current yield to the splitter and distributes to active projects by votes.</li>
            <li>Projects are stored off-chain in Supabase and mirrored on-chain with the same project id.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">contracts & components</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>Twyne-like Credit Vault (mock) for ERC-4626 deposits and yield accrual.</li>
            <li>ProjectsUpvoteSplitter for on-chain project registry, votes, and distribution.</li>
            <li>Octant-style strategy glue in the strategy contract to report assets and mint profit to donations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">smart contracts (built here)</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>MintableERC20 (USDC mock, 6 decimals): owner‑mintable token used for deposits and donations.</li>
            <li>MockTwyneCreditVault (ERC‑4626‑like): accepts USDC deposits, tracks shares, accrues yield via an exchange rate; includes <code className="px-1 rounded bg-black/5">accrueWithTime</code> for sim.</li>
            <li>ProjectsUpvoteSplitter: on‑chain registry keyed by Supabase project id; vote per epoch; <code className="px-1 rounded bg-black/5">distribute(token)</code> splits by vote weights.</li>
            <li>TwyneYieldDonatingStrategy (Octant‑style): deploys funds into the vault; reports assets as loose + converted shares; profits minted to the donation address.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">uvp (why this matters)</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>deposit once, keep principal; only yield flows to public goods you choose.</li>
            <li>on-chain voting sets donation weights, making allocation transparent and credibly neutral.</li>
            <li>no custody of funds by the app; vault + splitter contracts enforce the rules on-chain.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">why twyne (tech notes)</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>credit vault is ERC‑4626‑like, purpose‑built to extend credit to collateral vaults and accrue interest
              per an IRM curve. see <a className="underline underline-offset-4" href="https://twyne.gitbook.io/twyne/for-developers/contracts/credit-vault" target="_blank" rel="noreferrer">credit vault docs</a>.</li>
            <li>architecture separates roles: credit vault (lenders) and collateral vault (borrowers), wired via a factory and vault manager.
              see <a className="underline underline-offset-4" href="https://twyne.gitbook.io/twyne/for-developers/architecture/contracts" target="_blank" rel="noreferrer">architecture overview</a>, 
              <a className="underline underline-offset-4 ml-1" href="https://twyne.gitbook.io/twyne/for-developers/contracts/collateral-vault" target="_blank" rel="noreferrer">collateral vault</a>, 
              <a className="underline underline-offset-4 ml-1" href="https://twyne.gitbook.io/twyne/for-developers/contracts/collateral-vault-factory" target="_blank" rel="noreferrer">factory</a>.</li>
            <li>risk isolation: liquidation is handled on collateral side; credit vault stays standardized for LPs.</li>
            <li>simple deposits/withdraws for LPs; predictable conversions via shares/assets (convertToAssets/convertToShares).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">octant v2 integration (tech notes)</h2>
          <ul className="list-disc pl-6 space-y-2 text-black/70">
            <li>strategy reports total assets = loose underlying + vault assets converted from shares; profits get minted to the donation address.</li>
            <li>flow: user deposits USDC → shares accrue → user donates current yield → splitter distributes by vote weights.</li>
            <li>frontend uses viem public client for reads and explicit accounts for writes; usdc uses 6 decimals everywhere.</li>
          </ul>
        </section>

        <div className="pt-2 text-sm text-black/60">
          <Link href="/" className="underline underline-offset-4 hover:text-violet-900">go back</Link>
        </div>
      </main>
    </div>
  )
}


