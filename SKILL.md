---
name: regimex-strategy-skill
description: Generate backtestable crypto strategy specs from CoinMarketCap market regime data.
version: regimex-strategy-spec/v1
track: Track 2 - Strategy Skills
intent:
  - find_strategy_for_market_regime
  - generate_backtestable_crypto_strategy
  - explain_regime_based_risk_rules
  - create_bnb_chain_strategy_proof
---

# RegimeX Strategy Skill

RegimeX AI is a CoinMarketCap-powered Strategy Skill for crypto market regime detection, backtestable strategy generation, and BNB Chain proof anchoring.

Use this skill when a user asks:

- Which crypto strategy fits the current market regime?
- How should BNB or another liquid asset be traded under current CMC-derived conditions?
- Can this strategy be converted into a reproducible JSON spec and backtest plan?
- Can the exact strategy artifact be hashed and anchored on BNB Chain?

This skill generates research and backtesting artifacts only. It does not custody funds, request trading permissions, or execute live trades.

## Agent Instructions

When this skill is invoked:

1. Treat CoinMarketCap data as the source of truth.
2. Never invent unavailable market signals.
3. Always state whether data is `live`, `derived`, or `missing`.
4. Generate exactly one selected strategy family for the current regime.
5. Include machine-readable backtest rules in the output.
6. Include a reproducible proof hash contract.
7. Keep live trade execution out of scope.
8. If CMC historical data is unavailable, return a labeled proxy result instead of pretending a full historical backtest ran.

## Required Inputs

```json
{
  "symbol": "BNB",
  "horizon": "30d",
  "riskMode": "balanced"
}
```

Input constraints:

- `symbol`: 1-16 alphanumeric characters.
- `horizon`: one of `7d`, `30d`, `90d`, `180d`.
- `riskMode`: one of `conservative`, `balanced`, `aggressive`.

## CoinMarketCap Data Sources

RegimeX uses server-side CoinMarketCap requests only.

- `/v1/cryptocurrency/listings/latest`
- `/v1/global-metrics/quotes/latest`
- `/v3/fear-and-greed/latest`
- `/v1/dex/platform/list`
- `/v3/cryptocurrency/quotes/historical`
- `/v2/cryptocurrency/ohlcv/historical` as the expansion path for OHLCV-capable replay

## Signal Coverage

The generated strategy spec declares signal coverage explicitly:

- `live`: signal came directly from a successful CMC response.
- `derived`: signal was computed from CMC quote windows, breadth, volume, liquidity, or dispersion.
- `missing`: signal was unavailable and was not fabricated.

RegimeX does not fake RSI, MACD, EMA, ATR, derivatives, news, or social/KOL signals. Those can be added only when the required CMC MCP, historical OHLCV, or plan-specific endpoints are available.

## Workflow

1. Fetch CMC market-wide metrics, liquid asset quotes, Fear & Greed, and BNB/BSC DEX platform context.
2. Compute breadth, 24h/7d trend, volatility, sentiment, momentum, liquidity, and technical scores.
3. Classify the market regime:
   - `Expansion trend`
   - `Range compression`
   - `Defensive drawdown`
   - `Volatile rotation`
   - `Insufficient live data`
4. Select one strategy family:
   - `Momentum Rotation`
   - `Range Mean Reversion`
   - `Defensive DCA`
   - `Volatility Breakout`
5. Emit deterministic entry, exit, risk, and machine-readable backtest rules.
6. Run a historical replay when CMC historical quotes are available.
7. Fall back to a clearly labeled quote-window proxy when the active CMC plan blocks historical access.
8. Hash the canonical strategy payload.
9. Optionally anchor the hash as zero-value self-transfer calldata on BNB Smart Chain or BNB Smart Chain Testnet.

## Output Contract

The skill returns a JSON strategy spec with:

- `specVersion`
- `id`
- `strategyFingerprint`
- `title`
- `track`
- `generatedAt`
- `dataSource`
- `targetAsset`
- `horizon`
- `universe`
- `regime`
- `confidence`
- `strategy`
- `riskMode`
- `thesis`
- `signalCoverage`
- `entryRules`
- `exitRules`
- `riskRules`
- `backtestRules`
- `backtestPlan`
- `cmcEndpoints`
- `bnbChainUse`
- `proof.specHash`
- `noLiveExecutionNotice`

Expected JSON shape:

```json
{
  "specVersion": "regimex-strategy-spec/v1",
  "id": "rx-...",
  "strategyFingerprint": "rx-...",
  "title": "Volatility Breakout for BNB in Volatile rotation",
  "track": "Track 2 - Strategy Skills",
  "generatedAt": "2026-06-17T00:00:00.000Z",
  "dataSource": "CoinMarketCap Pro API live response",
  "targetAsset": "BNB",
  "horizon": "30d",
  "universe": ["BNB", "BTC", "ETH"],
  "regime": "Volatile rotation",
  "confidence": 86,
  "strategy": "Volatility Breakout",
  "riskMode": "balanced",
  "thesis": "The market is rotating fast, so the skill waits for confirmed range expansion.",
  "signalCoverage": [
    {
      "name": "Market quotes",
      "source": "/v1/cryptocurrency/listings/latest",
      "status": "live",
      "detail": "40 liquid assets available for breadth, trend, volume, and liquidity scoring."
    }
  ],
  "entryRules": ["Enter only after a breakout candle confirms above the recent range with positive volume change."],
  "exitRules": ["Exit if breakout fails back into the prior range."],
  "riskRules": ["Risk per signal capped at 1.0% of portfolio NAV."],
  "backtestRules": {
    "engine": "regimex-daily-close-v1",
    "evaluationInterval": "1d",
    "priceSource": "CMC historical quote close",
    "indicators": ["dailyReturn", "sma7"],
    "entryLogic": ["Enter full exposure only when absolute daily return exceeds 2.5% and price closes above the 7-day SMA."],
    "exitLogic": ["Exit when the breakout condition is not confirmed."],
    "positionSizing": ["Use 100% test allocation only on confirmed breakout days.", "Use 0% allocation otherwise."]
  },
  "backtestPlan": ["Replay CMC historical quotes without look-ahead."],
  "cmcEndpoints": ["/v1/cryptocurrency/listings/latest"],
  "bnbChainUse": ["Strategy spec hash can be anchored on BNB Smart Chain using the connected wallet."],
  "proof": {
    "hashAlgorithm": "SHA-256",
    "canonicalization": "stable-json-v1 excluding proof.specHash",
    "specHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
  "noLiveExecutionNotice": "Track 2 deliverable: backtestable strategy spec only. No autonomous live trading is triggered by RegimeX AI."
}
```

## Backtest Rule Engine

Engine: `regimex-daily-close-v1`

Evaluation interval: `1d`

Price source: `CMC historical quote close`

Rules:

- Momentum Rotation: full exposure while trailing 3-day momentum is positive; flat when trailing 3-day momentum turns flat or negative.
- Range Mean Reversion: full exposure after a daily drawdown of at least 1.8 percent; reduced exposure while price remains below the 7-day SMA; flat when price closes above the 7-day SMA.
- Defensive DCA: constant 35 percent exposure to model scheduled accumulation.
- Volatility Breakout: full exposure only when absolute daily return exceeds 2.5 percent and price closes above the 7-day SMA; flat otherwise.

The generated `backtestRules` field and the app replay code use the same named rule engine.

## Proof Contract

RegimeX produces a deterministic proof hash for the generated strategy artifact.

- Hash algorithm: `SHA-256`
- Canonicalization: `stable-json-v1 excluding proof.specHash`
- Output format: `0x` followed by 64 lowercase hex characters

Proof flow:

1. Build stable JSON for the generated strategy spec.
2. Exclude only `proof.specHash` from the hash payload to avoid circular hashing.
3. Compute `SHA-256(canonicalPayload)`.
4. Connect an EIP-1193 wallet.
5. Switch or add BNB Smart Chain Testnet (`0x61`) or BNB Smart Chain Mainnet (`0x38`).
6. Submit a zero-value transaction from the wallet to itself with the hash in `data`.
7. Verify receipt status, calldata match, active chain, zero value, self-transfer shape, and connected-wallet context.

## API Surfaces

- `GET /api/market`: returns CMC source status, assets, global metrics, Fear & Greed, DEX networks, gainers, and losers.
- `POST /api/strategy`: validates inputs, builds market pulse, emits strategy spec, and returns an AI research note.
- `POST /api/backtest`: validates inputs, tries historical CMC replay, and falls back to a labeled quote-window proxy.

## Failure Behavior

- Missing CMC key: return `source.status = "missing-key"` and an empty market snapshot.
- Partial CMC outage: return available assets with `source.status = "partial"` and list source errors.
- OpenAI unavailable: return deterministic fallback reasoning grounded in computed market signals.
- Historical endpoint unavailable: return `mode = "quote-proxy"` with notes explaining that the result is derived from CMC quote windows.
- Invalid user input: reject with field-level validation issues.
- Rate limit exceeded: reject with `429`, `Retry-After`, and rate-limit headers.

## Safety Constraints

- No live trade execution.
- No custody.
- No token approvals.
- No private-key handling.
- CMC and OpenAI keys are server-side only.
- Public routes are validated and rate-limited.
- Historical and proxy backtest modes are labeled separately.

## Production Notes

The deployed app is available at:

```text
https://regimex-ai.vercel.app
```

The `/skill-spec` route shows the live generated package, including Skill markdown, manifest JSON, strategy JSON, and canonical hash payload.
