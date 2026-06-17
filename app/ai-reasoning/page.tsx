import { AppShell } from "@/components/regimex/app-shell"
import { SourceStatus } from "@/components/regimex/market-ui"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { generateAiResearchNote } from "@/lib/regimex/openai"
import { analyzeMarket, buildStrategySpec } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function AiReasoningPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced" })
  const note = await generateAiResearchNote(snapshot, pulse, spec)

  return (
    <AppShell
      title="AI reasoning"
      description="The judge-visible explanation layer: why the strategy was selected, which CMC signals mattered, and how the output stays reproducible."
      action={<SourceStatus source={snapshot.source} />}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/35">AI status: {note.aiStatus}</div>
          <h2 className="mt-4 text-4xl font-light leading-[1.05]">{note.summary}</h2>
          <div className="mt-8 space-y-4">
            {note.reasoning.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-black/55">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3ba2f]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-black/[0.06] bg-black p-7 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Judge notes</div>
          <div className="mt-6 space-y-5">
            {note.judgeNotes.map((item) => (
              <div key={item} className="border-t border-white/10 pt-5 text-sm leading-6 text-white/60">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
