import { NextResponse } from "next/server"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { rateLimitRequest } from "@/lib/regimex/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limit = rateLimitRequest(request, "market", { limit: 60, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many market requests", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    )
  }

  const snapshot = await getMarketSnapshot()
  return NextResponse.json(snapshot)
}
