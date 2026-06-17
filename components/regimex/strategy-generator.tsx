"use client"

import { useMemo, useState } from "react"
import { BrainCircuit, Download, RefreshCw } from "lucide-react"
import type { AiResearchNote, MarketPulse, MarketSnapshot, RiskMode, StrategySpec } from "@/lib/regimex/types"
import { buildStrategyJson } from "@/lib/regimex/skill-spec"

type StrategyResponse = {
  snapshot: MarketSnapshot
  pulse: MarketPulse
  spec: StrategySpec
  researchNote: AiResearchNote
}

export function StrategyGenerator({ initial }: { initial: StrategyResponse }) {
  const [symbol, setSymbol] = useState(initial.spec.targetAsset)
  const [riskMode, setRiskMode] = useState<RiskMode>(initial.spec.riskMode)
  const [horizon, setHorizon] = useState<"7d" | "30d" | "90d" | "180d">("30d")
  const [result, setResult] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function generate() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, riskMode, horizon }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.issues?.[0]?.message || payload?.error || "Strategy generation failed.")
      }
      setResult(payload)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Strategy generation failed.")
    } finally {
      setLoading(false)
    }
  }

  const json = useMemo(() => buildStrategyJson(result.spec), [result.spec])
  const dataUrl = useMemo(() => `data:application/json;charset=utf-8,${encodeURIComponent(json)}`, [json])

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-[#f3ba2f]">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-2xl font-light">Generate a Strategy Skill</h2>
        <p className="mt-2 text-sm leading-6 text-black/45">
          Choose the target asset and risk mode. RegimeX will pull CMC data through the server route, classify the regime, and emit a backtestable Track 2 spec.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Target asset</span>
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-black/25"
              placeholder="BNB"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Horizon</span>
            <select
              value={horizon}
              onChange={(event) => setHorizon(event.target.value as typeof horizon)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/25"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="180d">180 days</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Risk mode</span>
            <select
              value={riskMode}
              onChange={(event) => setRiskMode(event.target.value as RiskMode)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/25"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row xl:flex-col">
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Generate Spec
          </button>
          <a
            href={dataUrl}
            download={`${result.spec.id}.json`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm text-black/60 transition-colors hover:border-black/20 hover:text-black"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </a>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900/75">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <div className="flex flex-col gap-5 border-b border-black/[0.06] pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/35">{result.spec.track}</div>
            <h2 className="mt-3 text-4xl font-light leading-[1.05]">{result.spec.title}</h2>
          </div>
          <div className="rounded-xl bg-black px-4 py-3 text-center text-white">
            <div className="text-2xl font-light">{result.spec.confidence}%</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Confidence</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RuleBlock title="Entry Rules" rules={result.spec.entryRules} />
          <RuleBlock title="Exit Rules" rules={result.spec.exitRules} />
          <RuleBlock title="Risk Rules" rules={result.spec.riskRules} />
          <RuleBlock title="Backtest Plan" rules={result.spec.backtestPlan} />
        </div>

        <div className="mt-6 rounded-2xl bg-black/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">AI Research Note</div>
          <p className="mt-3 text-sm leading-6 text-black/60">{result.researchNote.summary}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.researchNote.reasoning.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-black/50">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3ba2f]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function RuleBlock({ title, rules }: { title: string; rules: string[] }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white/60 p-5">
      <h3 className="text-sm font-medium text-black/75">{title}</h3>
      <div className="mt-4 space-y-3">
        {rules.map((rule) => (
          <div key={rule} className="flex gap-3 text-sm leading-6 text-black/50">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black/25" />
            <span>{rule}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
