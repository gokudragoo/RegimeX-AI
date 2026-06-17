import { AppShell } from "@/components/regimex/app-shell"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { buildHashableStrategyJson, buildSkillManifestJson, buildSkillMarkdown, buildStrategyJson } from "@/lib/regimex/skill-spec"
import { analyzeMarket, buildStrategySpec } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function SkillSpecPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced", horizon: "30d" })
  const markdown = buildSkillMarkdown(spec)
  const manifest = buildSkillManifestJson(spec)
  const json = buildStrategyJson(spec)
  const hashPayload = buildHashableStrategyJson(spec)

  return (
    <AppShell
      title="Strategy Skill package"
      description="A portable CMC Skill-style package: find-skill manifest, repeatable workflow, strategy JSON, machine-readable backtest rules, and canonical proof payload."
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/35">SKILL.md</div>
          <pre className="mt-5 max-h-[680px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-black/55">{markdown}</pre>
        </section>
        <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/35">skill manifest</div>
          <pre className="mt-5 max-h-[680px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-black/55">{manifest}</pre>
        </section>
        <section className="rounded-2xl border border-black/[0.06] bg-black p-6 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Strategy JSON</div>
          <pre className="mt-5 max-h-[680px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-white/55">{json}</pre>
        </section>
        <section className="rounded-2xl border border-black/[0.06] bg-black p-6 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Canonical hash payload</div>
          <pre className="mt-5 max-h-[680px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-white/55">{hashPayload}</pre>
        </section>
      </div>
    </AppShell>
  )
}
