import { AppShell } from "@/components/regimex/app-shell"
import { StrategyGenerator } from "@/components/regimex/strategy-generator"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { generateAiResearchNote } from "@/lib/regimex/openai"
import { analyzeMarket, buildStrategySpec } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function StrategyCenterPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced", horizon: "30d" })
  const researchNote = await generateAiResearchNote(snapshot, pulse, spec)

  return (
    <AppShell
      title="Strategy center"
      description="Generate the hackathon Track 2 deliverable: a reusable CMC Strategy Skill output with deterministic rules, backtest plan, and BNB Chain proof hooks."
    >
      <StrategyGenerator initial={{ snapshot, pulse, spec, researchNote }} />
    </AppShell>
  )
}
