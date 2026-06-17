import { z } from "zod"
import type { StrategyName } from "./types"

export const STRATEGY_NAMES = [
  "Momentum Rotation",
  "Range Mean Reversion",
  "Defensive DCA",
  "Volatility Breakout",
] as const

const riskModes = ["conservative", "balanced", "aggressive"] as const
const horizons = ["7d", "30d", "90d", "180d"] as const

const symbolSchema = z
  .string()
  .trim()
  .min(1, "Symbol is required")
  .max(16, "Symbol must be 16 characters or less")
  .regex(/^[a-z0-9]+$/i, "Symbol can only contain letters and numbers")
  .transform((value) => value.toUpperCase())

export const strategyRequestSchema = z
  .object({
    symbol: symbolSchema.default("BNB"),
    horizon: z.enum(horizons).default("30d"),
    riskMode: z.enum(riskModes).default("balanced"),
    capital: z.coerce.number().positive().max(1_000_000_000).optional(),
  })
  .strip()

export const backtestRequestSchema = z
  .object({
    symbol: symbolSchema.default("BNB"),
    periodDays: z.coerce.number().int().min(7).max(365).default(90),
    strategy: z.enum(STRATEGY_NAMES).optional(),
  })
  .strip()

export type ParsedStrategyRequest = z.infer<typeof strategyRequestSchema>
export type ParsedBacktestRequest = z.infer<typeof backtestRequestSchema>

export function parseStrategyRequest(payload: unknown) {
  return strategyRequestSchema.safeParse(payload ?? {})
}

export function parseBacktestRequest(payload: unknown) {
  return backtestRequestSchema.safeParse(payload ?? {})
}

export function validationIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "body",
    message: issue.message,
  }))
}
