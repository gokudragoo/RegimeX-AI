import { AppShell } from "@/components/regimex/app-shell"
import { BacktestSparkline, MetricTile } from "@/components/regimex/market-ui"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { formatPercent } from "@/lib/regimex/format"
import { runQuoteProxyBacktest } from "@/lib/regimex/strategy"
import type { StrategyName } from "@/lib/regimex/types"

export const dynamic = "force-dynamic"

const STRATEGIES: StrategyName[] = [
  "Momentum Rotation",
  "Range Mean Reversion",
  "Defensive DCA",
  "Volatility Breakout",
]

export default async function StrategyComparisonPage() {
  const snapshot = await getMarketSnapshot()
  const results = STRATEGIES.map((strategy) => runQuoteProxyBacktest(snapshot, strategy, "BNB", 90))
  const winner = [...results].sort((a, b) => b.returnPct - a.returnPct)[0]

  return (
    <AppShell
      title="Strategy comparison"
      description="Compare the four strategy families RegimeX can choose from before committing a generated Strategy Skill spec."
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-black/[0.06] bg-black p-7 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Best proxy result</div>
          <h2 className="mt-5 text-5xl font-light leading-[1.02]">{winner?.strategy ?? "Unavailable"}</h2>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Ranking is based on the transparent quote-window proxy. The full lab route can call historical quotes when the CMC plan permits it.
          </p>
        </section>
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {results.map((result) => (
            <div key={result.strategy} className="rounded-2xl border border-black/[0.06] bg-white/65 p-5">
              <h3 className="text-xl font-light">{result.strategy}</h3>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <MetricTile label="Return" value={formatPercent(result.returnPct)} />
                <MetricTile label="Drawdown" value={formatPercent(result.maxDrawdownPct)} />
                <MetricTile label="Sharpe" value={result.sharpe.toFixed(2)} />
              </div>
              <div className="mt-4 h-36 rounded-xl bg-black/[0.03] p-3">
                <BacktestSparkline points={result.points} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  )
}
