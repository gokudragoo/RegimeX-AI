import { NextResponse } from "next/server"
import { getHistoricalPrices, getMarketSnapshot } from "@/lib/regimex/cmc"
import { rateLimitHeaders, rateLimitRequest } from "@/lib/regimex/rate-limit"
import { analyzeMarket, runHistoricalBacktest, runQuoteProxyBacktest } from "@/lib/regimex/strategy"
import { parseBacktestRequest, validationIssues } from "@/lib/regimex/validation"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const limit = await rateLimitRequest(request, "backtest", { limit: 20, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many backtest requests", retryAfterSeconds: limit.retryAfterSeconds },
      {
        status: 429,
        headers: { ...rateLimitHeaders(limit), "Retry-After": String(limit.retryAfterSeconds) },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }

  const parsed = parseBacktestRequest(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid backtest request", issues: validationIssues(parsed.error) }, { status: 400 })
  }

  const { symbol, periodDays } = parsed.data
  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const strategy = parsed.data.strategy || pulse.strategy

  try {
    const prices = await getHistoricalPrices(symbol, periodDays)
    const result = runHistoricalBacktest(prices, strategy, symbol, periodDays)
    if (result.mode === "historical") return NextResponse.json({ result, snapshot, pulse }, { headers: rateLimitHeaders(limit) })
  } catch {
    // The fallback below is intentionally derived from live CMC quote windows.
  }

  const result = runQuoteProxyBacktest(snapshot, strategy, symbol, periodDays)
  return NextResponse.json({ result, snapshot, pulse }, { headers: rateLimitHeaders(limit) })
}
