import "server-only"

import { createHash } from "node:crypto"
import { fetchWithTimeout } from "./http"

type RateLimitOptions = {
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  backend: "upstash" | "memory"
}

type RedisConfig = {
  url: string
  token: string
}

type RedisEnvelope<T> = {
  result?: T
  error?: string
}

const buckets = new Map<string, Bucket>()
const MAX_MEMORY_BUCKETS = 5_000
const REDIS_TIMEOUT_MS = 1_200

function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  return `${scope}:${forwarded || realIp || "local"}`
}

function hashedBucketKey(key: string) {
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 32)
  return `regimex:rate-limit:${digest}`
}

function redisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? { url: url.replace(/\/$/, ""), token } : null
}

function commandUrl(config: RedisConfig, command: Array<string | number>) {
  const path = command.map((part) => encodeURIComponent(String(part))).join("/")
  return `${config.url}/${path}`
}

async function redisCommand<T>(config: RedisConfig, command: Array<string | number>) {
  const response = await fetchWithTimeout(
    commandUrl(config, command),
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    },
    REDIS_TIMEOUT_MS,
    "Redis rate limit",
  )

  const body = (await response.json().catch(() => null)) as RedisEnvelope<T> | null
  if (!response.ok || body?.error) {
    throw new Error(body?.error || `Redis rate limit request failed with HTTP ${response.status}`)
  }
  return body?.result as T
}

function sweepExpiredBuckets(now: number) {
  if (buckets.size <= MAX_MEMORY_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
    if (buckets.size <= MAX_MEMORY_BUCKETS) return
  }
}

function memoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  sweepExpiredBuckets(now)
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      retryAfterSeconds: 0,
      backend: "memory",
    }
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      backend: "memory",
    }
  }

  current.count += 1
  return {
    allowed: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - current.count),
    retryAfterSeconds: 0,
    backend: "memory",
  }
}

async function redisRateLimit(config: RedisConfig, key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const redisKey = hashedBucketKey(key)
  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000))
  const created = await redisCommand<string | null>(config, ["set", redisKey, 1, "ex", windowSeconds, "nx"])

  if (created === "OK") {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      retryAfterSeconds: 0,
      backend: "upstash",
    }
  }

  const count = Number(await redisCommand<number | string>(config, ["incr", redisKey]))
  let ttl = Number(await redisCommand<number | string>(config, ["ttl", redisKey]))
  if (!Number.isFinite(ttl) || ttl < 0) {
    await redisCommand(config, ["expire", redisKey, windowSeconds])
    ttl = windowSeconds
  }

  return {
    allowed: count <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - count),
    retryAfterSeconds: count <= options.limit ? 0 : Math.max(1, ttl),
    backend: "upstash",
  }
}

export async function rateLimitRequest(request: Request, scope: string, options: RateLimitOptions) {
  const key = clientKey(request, scope)
  const config = redisConfig()

  if (config) {
    try {
      return await redisRateLimit(config, key, options)
    } catch {
      return memoryRateLimit(key, options)
    }
  }

  return memoryRateLimit(key, options)
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Backend": result.backend,
  }
}
