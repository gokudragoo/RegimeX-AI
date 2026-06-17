import { AppShell } from "@/components/regimex/app-shell"
import { DataEmptyState } from "@/components/regimex/empty-state"
import { AssetTable, MarketStats, MetricTile, SourceStatus } from "@/components/regimex/market-ui"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { formatPercent } from "@/lib/regimex/format"
import { analyzeMarket } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function MarketIntelligencePage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)

  return (
    <AppShell
      title="Market intelligence"
      description="A compact terminal for the CMC signals that power strategy generation: breadth, movers, sentiment, global liquidity, and BNB/BSC DEX coverage."
      action={<SourceStatus source={snapshot.source} />}
    >
      {snapshot.source.status === "missing-key" ? (
        <DataEmptyState />
      ) : (
        <div className="space-y-5">
          <MarketStats marketCap={snapshot.global?.totalMarketCap} volume={snapshot.global?.totalVolume24h} dominance={snapshot.global?.btcDominance} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricTile label="Fear & Greed" value={snapshot.fearGreed ? `${snapshot.fearGreed.value}` : "--"} detail={snapshot.fearGreed?.classification} />
            <MetricTile label="Breadth Positive" value={`${pulse.breadthPositivePct}%`} />
            <MetricTile label="Volatility Score" value={`${pulse.volatilityScore}/100`} />
            <MetricTile label="Momentum Score" value={`${pulse.momentumScore}/100`} />
            <MetricTile label="Liquidity Score" value={`${pulse.liquidityScore}/100`} />
            <MetricTile label="Technical Score" value={`${pulse.technicalScore}/100`} />
            <MetricTile label="DEX Networks" value={String(snapshot.dexNetworks.length)} detail="From CMC DEX platform list" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
              <h2 className="text-2xl font-light">Top gainers</h2>
              <div className="mt-5 space-y-3">
                {snapshot.topGainers.map((asset) => (
                  <Mover key={asset.id} symbol={asset.symbol} name={asset.name} change={asset.change24h} />
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
              <h2 className="text-2xl font-light">Top losers</h2>
              <div className="mt-5 space-y-3">
                {snapshot.topLosers.map((asset) => (
                  <Mover key={asset.id} symbol={asset.symbol} name={asset.name} change={asset.change24h} />
                ))}
              </div>
            </section>
          </div>

          <AssetTable assets={snapshot.assets} />

          <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
            <h2 className="text-2xl font-light">BNB/BSC DEX context</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {snapshot.dexNetworks.slice(0, 9).map((network) => (
                <div key={network.slug} className="rounded-xl bg-black/[0.03] p-4">
                  <div className="font-mono text-sm text-black/70">{network.slug}</div>
                  <div className="mt-1 text-xs text-black/40">{network.name}</div>
                </div>
              ))}
            </div>
          </section>

          {snapshot.source.errors.length > 0 && (
            <section className="rounded-2xl border border-amber-500/20 bg-amber-50 p-6">
              <h2 className="text-xl font-light text-amber-900">Partial data notes</h2>
              <div className="mt-4 space-y-2">
                {snapshot.source.errors.map((error) => (
                  <div key={`${error.endpoint}-${error.message}`} className="text-sm text-amber-900/70">
                    {error.endpoint}: {error.message}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}

function Mover({ symbol, name, change }: { symbol: string; name: string; change?: number }) {
  const positive = (change ?? 0) >= 0
  return (
    <div className="flex items-center justify-between border-b border-black/[0.05] pb-3 last:border-b-0">
      <div>
        <div className="font-medium text-black/75">{symbol}</div>
        <div className="text-xs text-black/35">{name}</div>
      </div>
      <div className={`font-mono text-sm ${positive ? "text-emerald-700" : "text-red-700"}`}>{formatPercent(change)}</div>
    </div>
  )
}
