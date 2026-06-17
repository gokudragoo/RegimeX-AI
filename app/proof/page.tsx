import { AppShell } from "@/components/regimex/app-shell"
import { ProofClient } from "@/components/regimex/proof-client"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { analyzeMarket, buildStrategySpec } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function ProofPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced", horizon: "30d" })

  return (
    <AppShell
      title="BNB Chain proof"
      description="Hash the exact generated strategy JSON and anchor it as BNB Chain transaction calldata through a connected wallet."
    >
      <ProofClient spec={spec} />
    </AppShell>
  )
}
