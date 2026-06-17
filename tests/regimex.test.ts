import assert from "node:assert/strict"
import test from "node:test"
import type { MarketSnapshot } from "../lib/regimex/types.ts"
import { analyzeMarket, buildStrategySpec, runHistoricalBacktest, runQuoteProxyBacktest } from "../lib/regimex/strategy.ts"
import { parseBacktestRequest, parseStrategyRequest } from "../lib/regimex/validation.ts"

const snapshot: MarketSnapshot = {
  source: {
    status: "live",
    generatedAt: "2026-06-17T00:00:00.000Z",
    endpoints: [],
    errors: [],
    creditCount: 4,
  },
  assets: [
    {
      id: 1839,
      name: "BNB",
      symbol: "BNB",
      slug: "bnb",
      rank: 4,
      price: 610,
      marketCap: 82_000_000_000,
      volume24h: 1_200_000_000,
      change1h: 0.3,
      change24h: 1.2,
      change7d: 4.4,
      change30d: 7.8,
      volumeChange24h: 10,
    },
    {
      id: 1,
      name: "Bitcoin",
      symbol: "BTC",
      rank: 1,
      price: 66_000,
      marketCap: 1_300_000_000_000,
      volume24h: 28_000_000_000,
      change24h: 1.1,
      change7d: 5.2,
    },
    {
      id: 1027,
      name: "Ethereum",
      symbol: "ETH",
      rank: 2,
      price: 1_850,
      marketCap: 220_000_000_000,
      volume24h: 15_000_000_000,
      change24h: 0.9,
      change7d: 4.8,
    },
    {
      id: 3408,
      name: "USDC",
      symbol: "USDC",
      rank: 6,
      price: 1,
      marketCap: 75_000_000_000,
      volume24h: 10_000_000_000,
      change24h: 0.01,
      change7d: 0.01,
    },
    {
      id: 5426,
      name: "Solana",
      symbol: "SOL",
      rank: 7,
      price: 72,
      marketCap: 42_000_000_000,
      volume24h: 2_200_000_000,
      change24h: 1.8,
      change7d: 6.3,
    },
  ],
  global: {
    totalMarketCap: 2_200_000_000_000,
    totalVolume24h: 82_000_000_000,
    btcDominance: 58,
  },
  fearGreed: {
    value: 61,
    classification: "Greed",
  },
  dexNetworks: [{ name: "BNB Smart Chain (BEP20)", slug: "bsc", platformId: 14 }],
  topGainers: [],
  topLosers: [],
}

test("strategy request validation normalizes safe inputs", () => {
  const parsed = parseStrategyRequest({ symbol: "bnb", riskMode: "balanced", horizon: "90d" })
  assert.equal(parsed.success, true)
  assert.equal(parsed.data?.symbol, "BNB")
  assert.equal(parsed.data?.horizon, "90d")
})

test("strategy request validation rejects invalid risk mode", () => {
  const parsed = parseStrategyRequest({ symbol: "BNB", riskMode: "max-risk", horizon: "30d" })
  assert.equal(parsed.success, false)
})

test("backtest request validation clamps unsafe periods", () => {
  const parsed = parseBacktestRequest({ symbol: "BNB", periodDays: 5000, strategy: "Defensive DCA" })
  assert.equal(parsed.success, false)
})

test("strategy spec includes BSC proof context and deterministic contract fields", () => {
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced", horizon: "30d" })

  assert.equal(spec.track, "Track 2 - Strategy Skills")
  assert.equal(spec.specVersion, "regimex-strategy-spec/v1")
  assert.equal(spec.targetAsset, "BNB")
  assert.match(spec.proof.specHash, /^0x[a-f0-9]{64}$/)
  assert.equal(spec.backtestRules.engine, "regimex-daily-close-v1")
  assert.ok(spec.bnbChainUse.some((line) => line.includes("bsc")))
  assert.ok(spec.entryRules.length > 0)
})

test("strategy fingerprint stays stable across source refresh timestamps", () => {
  const pulse = analyzeMarket(snapshot)
  const first = buildStrategySpec(snapshot, pulse, { symbol: "BNB", riskMode: "balanced", horizon: "30d" })
  const refreshed = buildStrategySpec(
    {
      ...snapshot,
      source: { ...snapshot.source, generatedAt: "2026-06-17T01:00:00.000Z" },
    },
    pulse,
    { symbol: "BNB", riskMode: "balanced", horizon: "30d" },
  )

  assert.equal(first.strategyFingerprint, refreshed.strategyFingerprint)
  assert.equal(first.id, refreshed.id)
  assert.notEqual(first.proof.specHash, refreshed.proof.specHash)
})

test("quote proxy backtest uses market data and emits replay points", () => {
  const pulse = analyzeMarket(snapshot)
  const result = runQuoteProxyBacktest(snapshot, pulse.strategy, "BNB", 90)

  assert.equal(result.mode, "quote-proxy")
  assert.equal(result.symbol, "BNB")
  assert.equal(result.points.length, 12)
  assert.ok(result.points.every((point) => Number.isFinite(point.equity)))
})

test("historical backtest uses the named no-look-ahead rule engine", () => {
  const prices = Array.from({ length: 14 }, (_, index) => ({
    t: `2026-06-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    price: 100 + index * 2,
  }))
  const result = runHistoricalBacktest(prices, "Momentum Rotation", "BNB", 14)

  assert.equal(result.mode, "historical")
  assert.ok(result.notes.some((note) => note.includes("regimex-daily-close-v1")))
  assert.ok(result.points.length >= 10)
})
