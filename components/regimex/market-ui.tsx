import type { AssetQuote, BacktestPoint, DataSourceState, MarketPulse } from "@/lib/regimex/types"
import { formatCurrency, formatNumber, formatPercent, shortDateTime } from "@/lib/regimex/format"

export function SourceStatus({ source }: { source: DataSourceState }) {
  const tone =
    source.status === "live"
      ? "bg-emerald-500"
      : source.status === "partial"
        ? "bg-amber-500"
        : "bg-red-500"

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white/65 px-3 py-2 text-xs text-black/45">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      <span className="font-mono uppercase tracking-[0.14em]">{source.status.replace("-", " ")}</span>
      <span>{shortDateTime(source.generatedAt)}</span>
    </div>
  )
}

export function MetricTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/65 p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-black/35">{label}</div>
      <div className="mt-3 break-words text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.05] text-black/85">{value}</div>
      {detail && <div className="mt-3 text-xs leading-5 text-black/40">{detail}</div>}
    </div>
  )
}

export function RegimeMeter({ pulse }: { pulse: MarketPulse }) {
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-black/[0.06] bg-[#11100d] p-7 text-white">
      <div className="absolute inset-0 opacity-35" style={{ background: "radial-gradient(circle at 75% 20%, rgba(243,186,47,0.45), transparent 34%)" }} />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Current Regime</div>
        <h2 className="mt-5 max-w-xl text-5xl font-light leading-[1.02] md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          {pulse.label}
        </h2>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["Confidence", `${pulse.confidence}%`],
            ["Health", `${pulse.healthScore}/100`],
            ["Breadth", `${pulse.breadthPositivePct}%`],
          ].map(([label, value]) => (
            <div key={label} className="border-t border-white/12 pt-4">
              <div className="text-2xl font-light">{value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AssetTable({ assets }: { assets: AssetQuote[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/65">
      <div className="grid grid-cols-[70px_1fr_110px_100px_100px] gap-4 border-b border-black/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-black/35 max-md:grid-cols-[60px_1fr_90px]">
        <span>Rank</span>
        <span>Asset</span>
        <span>Price</span>
        <span className="max-md:hidden">24h</span>
        <span className="max-md:hidden">7d</span>
      </div>
      {assets.slice(0, 12).map((asset) => (
        <div
          key={asset.id}
          className="grid grid-cols-[70px_1fr_110px_100px_100px] gap-4 border-b border-black/[0.04] px-5 py-4 text-sm last:border-b-0 max-md:grid-cols-[60px_1fr_90px]"
        >
          <span className="font-mono text-black/35">#{asset.rank ?? "--"}</span>
          <span>
            <span className="font-medium text-black/80">{asset.symbol}</span>
            <span className="ml-2 text-black/35">{asset.name}</span>
          </span>
          <span className="font-mono text-black/70">{formatCurrency(asset.price, asset.price > 10 ? 2 : 5)}</span>
          <PercentCell value={asset.change24h} className="max-md:hidden" />
          <PercentCell value={asset.change7d} className="max-md:hidden" />
        </div>
      ))}
    </div>
  )
}

function PercentCell({ value, className = "" }: { value?: number; className?: string }) {
  const positive = (value ?? 0) >= 0
  return (
    <span className={`font-mono ${positive ? "text-emerald-700" : "text-red-700"} ${className}`}>
      {formatPercent(value)}
    </span>
  )
}

export function SignalList({ pulse }: { pulse: MarketPulse }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
      <div className="text-[10px] uppercase tracking-[0.18em] text-black/35">Agent Reasoning Signals</div>
      <div className="mt-5 space-y-4">
        {pulse.signalSummary.map((signal) => (
          <div key={signal} className="flex gap-3 text-sm leading-6 text-black/55">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3ba2f]" />
            <span>{signal}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BacktestSparkline({ points }: { points: BacktestPoint[] }) {
  const width = 680
  const height = 180
  if (!points.length) {
    return (
      <div className="grid min-h-[180px] place-items-center rounded-xl border border-dashed border-black/10 text-sm text-black/35">
        No backtest points available
      </div>
    )
  }

  const values = points.map((point) => point.equity)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const d = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 18) - 9
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[180px] w-full" role="img" aria-label="Backtest equity curve">
      <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="rgba(243,186,47,0.16)" />
      <path d={d} fill="none" stroke="#11100d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MarketStats({
  marketCap,
  volume,
  dominance,
}: {
  marketCap?: number | null
  volume?: number | null
  dominance?: number | null
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <MetricTile label="Total Market Cap" value={formatCurrency(marketCap)} />
      <MetricTile label="24h Volume" value={formatCurrency(volume)} />
      <MetricTile label="BTC Dominance" value={`${formatNumber(dominance, 2)}%`} />
    </div>
  )
}
