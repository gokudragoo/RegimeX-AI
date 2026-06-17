import { AppShell } from "@/components/regimex/app-shell"
import { BacktestClient } from "@/components/regimex/backtest-client"
import { getHistoricalPrices, getMarketSnapshot } from "@/lib/regimex/cmc"
import { analyzeMarket, runHistoricalBacktest, runQuoteProxyBacktest } from "@/lib/regimex/strategy"

export const dynamic = "force-dynamic"

export default async function BacktestingLabPage() {
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  let initial = runQuoteProxyBacktest(snapshot, pulse.strategy, "BNB", 90)

  try {
    const prices = await getHistoricalPrices("BNB", 90)
    const historical = runHistoricalBacktest(prices, pulse.strategy, "BNB", 90)
    if (historical.mode === "historical") initial = historical
  } catch {
    // Keep the quote-window proxy visible when the CMC plan blocks historical quotes.
  }

  return (
    <AppShell
      title="Backtesting lab"
      description="Replay strategy logic against CMC historical data where available, with an explicit quote-window proxy fallback for plans that do not expose historical quotes."
    >
      <BacktestClient initial={initial} />
    </AppShell>
  )
}
