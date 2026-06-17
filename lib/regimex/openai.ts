import "server-only"

import type { AiResearchNote, MarketPulse, MarketSnapshot, StrategySpec } from "./types"

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const fallbackNote = (pulse: MarketPulse, spec: StrategySpec): AiResearchNote => ({
  aiStatus: "fallback",
  summary: `${spec.strategy} is selected because CMC-derived signals classify the current market as ${pulse.label} with ${pulse.confidence}% confidence.`,
  reasoning: pulse.signalSummary,
  judgeNotes: [
    "CMC data is the primary signal source.",
    "The output is a Track 2 strategy spec, not a live trading agent.",
    "The generated spec can be hashed and anchored on BNB Chain for reproducibility.",
  ],
})

function parseJsonObject(value: string | null | undefined) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function stringArray(value: unknown, fallback: string[], max = 5) {
  if (!Array.isArray(value)) return fallback
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max)
  return cleaned.length ? cleaned : fallback
}

export async function generateAiResearchNote(
  snapshot: MarketSnapshot,
  pulse: MarketPulse,
  spec: StrategySpec,
): Promise<AiResearchNote> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { ...fallbackNote(pulse, spec), aiStatus: "missing-key" }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are RegimeX AI, a crypto quant research agent. Return concise JSON only. Do not invent metrics; use supplied CMC-derived fields.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Explain why this Track 2 strategy skill output is technically sound and judge-ready.",
              sourceStatus: snapshot.source.status,
              pulse,
              spec,
              expectedShape: {
                summary: "one sentence",
                reasoning: ["3-5 bullets grounded in supplied data"],
                judgeNotes: ["3 bullets for hackathon judges"],
              },
            }),
          },
        ],
      }),
    })

    if (!response.ok) return fallbackNote(pulse, spec)

    const grounded = fallbackNote(pulse, spec)
    const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null
    const parsed = parseJsonObject(payload?.choices?.[0]?.message?.content)
    if (!parsed) return grounded

    const summary = typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : grounded.summary

    return {
      aiStatus: "live",
      summary,
      reasoning: stringArray(parsed.reasoning, grounded.reasoning),
      judgeNotes: stringArray(parsed.judgeNotes, grounded.judgeNotes, 4),
    }
  } catch {
    return fallbackNote(pulse, spec)
  }
}
