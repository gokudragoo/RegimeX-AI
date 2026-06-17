import { AppShell } from "@/components/regimex/app-shell"
import { DataEmptyState } from "@/components/regimex/empty-state"
import { AssetTable, MarketStats, MetricTile, RegimeMeter, SignalList, SourceStatus } from "@/components/regimex/market-ui"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { formatPercent } from "@/lib/regimex/format"
import { analyzeMarket } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)

  return (
    <AppShell
      title="Regime dashboard"
      description="Live market regime detection from CoinMarketCap data, distilled into the strategy posture RegimeX will use across the app."
      action={<SourceStatus source={snapshot.source} />}
    >
      {snapshot.source.status === "missing-key" ? (
        <DataEmptyState />
      ) : (
        <div className="space-y-5">
          <RegimeMeter pulse={pulse} />
          <MarketStats marketCap={snapshot.global?.totalMarketCap} volume={snapshot.global?.totalVolume24h} dominance={snapshot.global?.btcDominance} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <MetricTile label="24h Avg Move" value={formatPercent(pulse.avgChange24h)} />
            <MetricTile label="7d Avg Move" value={formatPercent(pulse.avgChange7d)} />
            <MetricTile label="Technical Score" value={`${pulse.technicalScore}/100`} />
            <MetricTile label="Liquidity Score" value={`${pulse.liquidityScore}/100`} />
            <MetricTile label="Risk Posture" value={pulse.riskPosture} />
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
            <AssetTable assets={snapshot.assets} />
            <SignalList pulse={pulse} />
          </div>
        </div>
      )}
    </AppShell>
  )
}
