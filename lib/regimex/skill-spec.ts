import type { StrategySpec } from "./types"

function normalizeForJson(value: unknown, omitSpecHash: boolean): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeForJson(item, omitSpecHash))
  if (!value || typeof value !== "object") return value

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((normalized, key) => {
      if (omitSpecHash && key === "specHash") return normalized
      normalized[key] = normalizeForJson((value as Record<string, unknown>)[key], omitSpecHash)
      return normalized
    }, {})
}

export function buildSkillMarkdown(spec: StrategySpec) {
  return `---
name: regimex-strategy-skill
description: Generate backtestable crypto trading strategy specs from CoinMarketCap market regime data.
version: ${spec.specVersion}
intent:
  - find_strategy_for_market_regime
  - generate_backtestable_crypto_strategy
  - explain_regime_based_risk_rules
---

# RegimeX Strategy Skill

Use this skill when a user asks which crypto strategy fits the current market regime.

## Required Inputs

- Target asset: ${spec.targetAsset}
- Risk mode: ${spec.riskMode}
- Strategy: ${spec.strategy}
- Regime: ${spec.regime}
- Horizon: ${spec.horizon}
- Strategy fingerprint: ${spec.strategyFingerprint}

## Data Sources

${spec.cmcEndpoints.map((endpoint) => `- CoinMarketCap \`${endpoint}\``).join("\n")}

## Signal Coverage

${spec.signalCoverage.map((signal) => `- ${signal.name}: ${signal.status} via ${signal.source}. ${signal.detail}`).join("\n")}

## Input Schema

\`\`\`json
{
  "symbol": "BNB",
  "horizon": "30d",
  "riskMode": "balanced"
}
\`\`\`

## Workflow

1. Fetch CMC market-wide metrics, liquid asset quotes, Fear & Greed, and BNB/BSC DEX platform context.
2. Classify the market regime from breadth, trend, volatility, and sentiment.
3. Select one strategy family and emit deterministic entry, exit, risk, and machine-readable backtest rules.
4. Run or request a historical CMC replay with no look-ahead using the \`${spec.backtestRules.engine}\` engine.
5. Hash the canonical payload and optionally anchor it on BNB Chain.

## Backtest Rule Engine

- Engine: ${spec.backtestRules.engine}
- Evaluation interval: ${spec.backtestRules.evaluationInterval}
- Price source: ${spec.backtestRules.priceSource}
- Indicators: ${spec.backtestRules.indicators.join(", ")}

Entry logic:
${spec.backtestRules.entryLogic.map((rule) => `- ${rule}`).join("\n")}

Exit logic:
${spec.backtestRules.exitLogic.map((rule) => `- ${rule}`).join("\n")}

Position sizing:
${spec.backtestRules.positionSizing.map((rule) => `- ${rule}`).join("\n")}

## Output Contract

Return JSON with \`specVersion\`, \`id\`, \`regime\`, \`confidence\`, \`strategy\`, \`signalCoverage\`, \`entryRules\`, \`exitRules\`, \`riskRules\`, \`backtestRules\`, \`backtestPlan\`, and \`proof.specHash\`.

## Proof Contract

- Hash algorithm: ${spec.proof.hashAlgorithm}
- Canonicalization: ${spec.proof.canonicalization}
- Current spec hash: ${spec.proof.specHash}
`
}

export function buildHashableStrategyJson(spec: StrategySpec) {
  return JSON.stringify(normalizeForJson(spec, true), null, 2)
}

export function buildSkillManifestJson(spec: StrategySpec) {
  return JSON.stringify(
    normalizeForJson(
      {
        name: "regimex-strategy-skill",
        version: spec.specVersion,
        description: "Generate regime-aware, backtestable crypto strategy specs from CoinMarketCap market data.",
        find_skill: {
          intents: [
            "which crypto strategy fits this market regime",
            "generate a backtestable BNB strategy",
            "explain market regime risk rules",
            "compare momentum mean reversion dca breakout",
          ],
          required_capabilities: ["CoinMarketCap market data", "historical quote replay", "strategy spec JSON"],
        },
        input_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            symbol: { type: "string", pattern: "^[A-Za-z0-9]{1,16}$", default: spec.targetAsset },
            horizon: { type: "string", enum: ["7d", "30d", "90d", "180d"], default: spec.horizon },
            riskMode: { type: "string", enum: ["conservative", "balanced", "aggressive"], default: spec.riskMode },
          },
          required: ["symbol", "horizon", "riskMode"],
        },
        output_schema: {
          type: "object",
          required: [
            "specVersion",
            "id",
            "regime",
            "strategy",
            "signalCoverage",
            "backtestRules",
            "proof",
            "noLiveExecutionNotice",
          ],
        },
        tools: spec.cmcEndpoints.map((endpoint) => ({ provider: "CoinMarketCap", endpoint })),
        proof: spec.proof,
      },
      false,
    ),
    null,
    2,
  )
}

export function buildStrategyJson(spec: StrategySpec) {
  return JSON.stringify(normalizeForJson(spec, false), null, 2)
}
