import { NextResponse } from "next/server"
import { getMarketSnapshot } from "@/lib/regimex/cmc"
import { generateAiResearchNote } from "@/lib/regimex/openai"
import { rateLimitRequest } from "@/lib/regimex/rate-limit"
import { analyzeMarket, buildStrategySpec } from "@/lib/regimex/strategy"
import { parseStrategyRequest, validationIssues } from "@/lib/regimex/validation"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const limit = rateLimitRequest(request, "strategy", { limit: 12, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many strategy requests", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }

  const parsed = parseStrategyRequest(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid strategy request", issues: validationIssues(parsed.error) }, { status: 400 })
  }

  const snapshot = await getMarketSnapshot()
  const pulse = analyzeMarket(snapshot)
  const spec = buildStrategySpec(snapshot, pulse, parsed.data)
  const researchNote = await generateAiResearchNote(snapshot, pulse, spec)

  return NextResponse.json({
    snapshot,
    pulse,
    spec,
    researchNote,
  })
}
