import "server-only"

import type {
  AssetQuote,
  DexNetwork,
  FearGreed,
  GlobalMetrics,
  MarketSnapshot,
  SourceError,
} from "./types"
import { fetchWithTimeout } from "./http"

const CMC_BASE_URL = "https://pro-api.coinmarketcap.com"
const MARKET_CACHE_TTL_MS = 60_000
const HISTORICAL_CACHE_TTL_MS = 10 * 60_000
const MARKET_REQUEST_TIMEOUT_MS = 8_000
const HISTORICAL_REQUEST_TIMEOUT_MS = 15_000
const MAX_CACHE_ENTRIES = 80

type CmcStatus = {
  error_code?: number | string
  error_message?: string | null
  credit_count?: number
}

type CmcEnvelope<T> = {
  status?: CmcStatus
  data: T
}

type CacheEntry = {
  expiresAt: number
  value: CmcEnvelope<unknown>
}

const cmcCache = new Map<string, CacheEntry>()

class CmcRequestError extends Error {
  endpoint: string

  constructor(endpoint: string, message: string) {
    super(message)
    this.endpoint = endpoint
  }
}

function apiKey() {
  return (
    process.env.COINMARKETCAP_API_KEY ||
    process.env.CMC_PRO_API_KEY ||
    process.env.CMC_API_KEY ||
    ""
  )
}

function endpointUrl(endpoint: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(endpoint, CMC_BASE_URL)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  }
  return url
}

function cacheTtl(endpoint: string) {
  return endpoint.includes("historical") ? HISTORICAL_CACHE_TTL_MS : MARKET_CACHE_TTL_MS
}

function trimCache() {
  if (cmcCache.size <= MAX_CACHE_ENTRIES) return
  const firstKey = cmcCache.keys().next().value
  if (firstKey) cmcCache.delete(firstKey)
}

async function fetchCmc<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  init?: RequestInit,
): Promise<CmcEnvelope<T>> {
  const key = apiKey()
  if (!key) throw new CmcRequestError(endpoint, "Missing CoinMarketCap API key")
  const url = endpointUrl(endpoint, params)
  const cacheKey = url.toString()
  const cached = cmcCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as CmcEnvelope<T>
  }

  const response = await fetchWithTimeout(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": key,
      ...(init?.headers ?? {}),
    },
  }, endpoint.includes("historical") ? HISTORICAL_REQUEST_TIMEOUT_MS : MARKET_REQUEST_TIMEOUT_MS, `CoinMarketCap ${endpoint}`)

  let body: CmcEnvelope<T> | undefined
  try {
    body = (await response.json()) as CmcEnvelope<T>
  } catch {
    body = undefined
  }

  const apiStatus = body?.status
  const apiMessage = apiStatus?.error_message?.trim()
  if (!response.ok) {
    throw new CmcRequestError(endpoint, apiMessage || `CoinMarketCap request failed with HTTP ${response.status}`)
  }

  const errorCode = Number(apiStatus?.error_code ?? 0)
  if (Number.isFinite(errorCode) && errorCode !== 0) {
    const fallback = `CoinMarketCap API returned error code ${errorCode}`
    throw new CmcRequestError(endpoint, apiMessage || fallback)
  }

  if (!body) throw new CmcRequestError(endpoint, "CoinMarketCap returned an unreadable response")
  cmcCache.set(cacheKey, { expiresAt: Date.now() + cacheTtl(endpoint), value: body as CmcEnvelope<unknown> })
  trimCache()
  return body
}

function toAssetQuote(item: any): AssetQuote | null {
  const usd = item?.quote?.USD
  if (!usd || typeof usd.price !== "number") return null

  return {
    id: Number(item.id),
    name: String(item.name ?? item.symbol ?? "Unknown"),
    symbol: String(item.symbol ?? "").toUpperCase(),
    slug: item.slug,
    rank: item.cmc_rank,
    price: Number(usd.price),
    marketCap: Number(usd.market_cap ?? 0),
    volume24h: Number(usd.volume_24h ?? 0),
    circulatingSupply: item.circulating_supply ? Number(item.circulating_supply) : undefined,
    change1h: numberOrUndefined(usd.percent_change_1h),
    change24h: numberOrUndefined(usd.percent_change_24h),
    change7d: numberOrUndefined(usd.percent_change_7d),
    change30d: numberOrUndefined(usd.percent_change_30d),
    volumeChange24h: numberOrUndefined(usd.volume_change_24h),
    lastUpdated: usd.last_updated ?? item.last_updated,
  }
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function parseGlobalMetrics(data: any): GlobalMetrics | null {
  const usd = data?.quote?.USD
  if (!usd) return null
  return {
    totalMarketCap: Number(usd.total_market_cap ?? 0),
    totalVolume24h: Number(usd.total_volume_24h ?? 0),
    btcDominance: numberOrUndefined(data.btc_dominance),
    ethDominance: numberOrUndefined(data.eth_dominance),
    defiVolume24h: numberOrUndefined(usd.defi_volume_24h),
    stablecoinVolume24h: numberOrUndefined(usd.stablecoin_volume_24h),
    lastUpdated: data.last_updated,
  }
}

function parseFearGreed(data: any): FearGreed | null {
  const record = Array.isArray(data) ? data[0] : data
  if (!record) return null
  const value = Number(record.value)
  if (!Number.isFinite(value)) return null
  return {
    value,
    classification: String(record.value_classification ?? record.classification ?? "Unknown"),
    updatedAt: record.update_time ?? record.timestamp,
  }
}

function slugFrom(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseDexNetworks(data: any): DexNetwork[] {
  const list = Array.isArray(data) ? data : Array.isArray(data?.platforms) ? data.platforms : []
  return list
    .map((item: any) => {
      const name = String(item.name ?? item.platform_name ?? item.n ?? item.dn ?? item.slug ?? "Unknown")
      const slug = slugFrom(item.slug ?? item.network_slug ?? item.platform_slug ?? item.pltA ?? item.dn ?? item.n)
      return {
        name,
        slug,
        platformId: numberOrUndefined(item.id ?? item.platform_crypto_id ?? item.cid ?? item.chId),
        dexCount: numberOrUndefined(item.dex_count ?? item.dexCount),
      }
    })
    .filter((item: DexNetwork) => item.slug)
}

function sourceError(error: unknown): SourceError {
  if (error instanceof CmcRequestError) {
    return { endpoint: error.endpoint, message: error.message }
  }
  return { endpoint: "unknown", message: error instanceof Error ? error.message : "Unknown error" }
}

export async function getMarketSnapshot(limit = 40): Promise<MarketSnapshot> {
  const generatedAt = new Date().toISOString()

  if (!apiKey()) {
    return {
      source: {
        status: "missing-key",
        generatedAt,
        endpoints: [],
        errors: [{ endpoint: "configuration", message: "Missing CoinMarketCap API key" }],
      },
      assets: [],
      global: null,
      fearGreed: null,
      dexNetworks: [],
      topGainers: [],
      topLosers: [],
    }
  }

  const endpoints = [
    "/v1/cryptocurrency/listings/latest",
    "/v1/global-metrics/quotes/latest",
    "/v3/fear-and-greed/latest",
    "/v1/dex/platform/list",
  ]

  const [listings, global, fearGreed, dexPlatforms] = await Promise.allSettled([
    fetchCmc<any[]>("/v1/cryptocurrency/listings/latest", {
      start: 1,
      limit,
      sort: "market_cap",
      convert: "USD",
    }),
    fetchCmc<any>("/v1/global-metrics/quotes/latest", { convert: "USD" }),
    fetchCmc<any>("/v3/fear-and-greed/latest"),
    fetchCmc<any>("/v1/dex/platform/list"),
  ])

  const errors = [listings, global, fearGreed, dexPlatforms]
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => sourceError(result.reason))

  const assets =
    listings.status === "fulfilled"
      ? listings.value.data.map(toAssetQuote).filter((item): item is AssetQuote => Boolean(item))
      : []

  const sortedByChange = [...assets].filter((asset) => asset.change24h != null)
  sortedByChange.sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))

  const creditCount = [listings, global, fearGreed, dexPlatforms].reduce((sum, result) => {
    if (result.status !== "fulfilled") return sum
    return sum + (result.value.status?.credit_count ?? 0)
  }, 0)

  return {
    source: {
      status: errors.length === 0 ? "live" : assets.length > 0 ? "partial" : "error",
      generatedAt,
      endpoints,
      errors,
      creditCount,
    },
    assets,
    global: global.status === "fulfilled" ? parseGlobalMetrics(global.value.data) : null,
    fearGreed: fearGreed.status === "fulfilled" ? parseFearGreed(fearGreed.value.data) : null,
    dexNetworks: dexPlatforms.status === "fulfilled" ? parseDexNetworks(dexPlatforms.value.data) : [],
    topGainers: sortedByChange.slice(0, 6),
    topLosers: sortedByChange.slice(-6).reverse(),
  }
}

export async function getHistoricalPrices(symbol: string, days: number) {
  const timeEnd = new Date()
  const timeStart = new Date(timeEnd.getTime() - days * 24 * 60 * 60 * 1000)

  const envelope = await fetchCmc<any>("/v3/cryptocurrency/quotes/historical", {
    symbol: symbol.toUpperCase(),
    time_start: timeStart.toISOString(),
    time_end: timeEnd.toISOString(),
    interval: "daily",
    convert: "USD",
  })

  const data = envelope.data
  const records = Array.isArray(data)
    ? data.flatMap((item) => item.quotes ?? [])
    : Array.isArray(data?.quotes)
      ? data.quotes
      : Object.values(data ?? {}).flatMap((item: any) => item?.quotes ?? [])

  return records
    .map((quote: any) => ({
      t: String(quote.timestamp ?? quote.time_open ?? quote.time_close ?? ""),
      price: Number(quote.quote?.USD?.price ?? quote.price ?? 0),
    }))
    .filter((point: { t: string; price: number }) => point.t && Number.isFinite(point.price) && point.price > 0)
    .sort((a: { t: string }, b: { t: string }) => new Date(a.t).valueOf() - new Date(b.t).valueOf())
}
