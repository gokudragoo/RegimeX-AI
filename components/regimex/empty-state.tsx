import Link from "next/link"

export function DataEmptyState({ title = "Live market data is not connected yet" }: { title?: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-8">
      <h2 className="text-2xl font-light">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
        RegimeX keeps CoinMarketCap requests server-side. Add the CMC key to the local environment, restart the app, and these surfaces will fill with live market data instead of fallback states.
      </p>
      <Link href="/skill-spec" className="mt-6 inline-flex rounded-xl bg-black px-4 py-3 text-sm text-white transition-colors hover:bg-black/80">
        View the Strategy Skill contract
      </Link>
    </div>
  )
}
