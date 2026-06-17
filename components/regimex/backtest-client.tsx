"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { BacktestSparkline, MetricTile } from "./market-ui"
import type { BacktestResult, StrategyName } from "@/lib/regimex/types"
import { formatPercent } from "@/lib/regimex/format"

const STRATEGIES: StrategyName[] = [
  "Momentum Rotation",
  "Range Mean Reversion",
  "Defensive DCA",
  "Volatility Breakout",
]

export function BacktestClient({ initial }: { initial: BacktestResult }) {
  const [symbol, setSymbol] = useState(initial.symbol)
  const [periodDays, setPeriodDays] = useState(initial.periodDays)
  const [strategy, setStrategy] = useState<StrategyName>(initial.strategy)
  const [result, setResult] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function run() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, periodDays, strategy }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.result) {
        throw new Error(payload?.issues?.[0]?.message || payload?.error || "Backtest failed.")
      }
      setResult(payload.result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Backtest failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <h2 className="text-2xl font-light">Replay Controls</h2>
        <p className="mt-2 text-sm leading-6 text-black/45">
          RegimeX tries CMC historical quotes first. If the plan does not expose that endpoint, it falls back to a transparent CMC quote-window proxy.
        </p>
        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Symbol</span>
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-black/25"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Strategy</span>
            <select
              value={strategy}
              onChange={(event) => setStrategy(event.target.value as StrategyName)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/25"
            >
              {STRATEGIES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Period</span>
            <select
              value={periodDays}
              onChange={(event) => setPeriodDays(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/25"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </label>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {loading ? "Running..." : "Run Backtest"}
        </button>
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900/75">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">Backtest Result</div>
            <h2 className="mt-2 text-2xl font-light">{result.strategy} on {result.symbol}</h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/35">{result.periodDays} days</div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricTile label="Return" value={formatPercent(result.returnPct)} detail={result.mode} />
          <MetricTile label="Win Rate" value={formatPercent(result.winRatePct)} />
          <MetricTile label="Max Drawdown" value={formatPercent(result.maxDrawdownPct)} />
          <MetricTile label="Sharpe" value={result.sharpe.toFixed(2)} />
        </div>
        <div className="mt-6 rounded-2xl bg-black/[0.03] p-4">
          <BacktestSparkline points={result.points} />
        </div>
        <div className="mt-5 space-y-2">
          {result.notes.map((note) => (
            <div key={note} className="text-sm leading-6 text-black/45">{note}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
