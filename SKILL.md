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
