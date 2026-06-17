export type DataSourceStatus = "live" | "partial" | "missing-key" | "error"

export type RegimeLabel =
  | "Expansion trend"
  | "Range compression"
  | "Defensive drawdown"
  | "Volatile rotation"
  | "Insufficient live data"

export type StrategyName =
  | "Momentum Rotation"
  | "Range Mean Reversion"
  | "Defensive DCA"
  | "Volatility Breakout"

export type RiskMode = "conservative" | "balanced" | "aggressive"

export interface SourceError {
  endpoint: string
  message: string
}

export interface DataSourceState {
  status: DataSourceStatus
  generatedAt: string
  endpoints: string[]
  errors: SourceError[]
  plan?: string
  creditCount?: number
}

export interface AssetQuote {
  id: number
  name: string
  symbol: string
  slug?: string
  rank?: number
  price: number
  marketCap: number
  volume24h: number
  circulatingSupply?: number
  change1h?: number
  change24h?: number
  change7d?: number
  change30d?: number
  volumeChange24h?: number
  lastUpdated?: string
}

export interface GlobalMetrics {
  totalMarketCap: number
  totalVolume24h: number
  btcDominance?: number
  ethDominance?: number
  defiVolume24h?: number
  stablecoinVolume24h?: number
  lastUpdated?: string
}

export interface FearGreed {
  value: number
  classification: string
  updatedAt?: string
}

export interface DexNetwork {
  name: string
  slug: string
  platformId?: number
  dexCount?: number
}

export interface MarketSnapshot {
  source: DataSourceState
  assets: AssetQuote[]
  global: GlobalMetrics | null
  fearGreed: FearGreed | null
  dexNetworks: DexNetwork[]
  topGainers: AssetQuote[]
  topLosers: AssetQuote[]
}

export interface MarketPulse {
  label: RegimeLabel
  strategy: StrategyName
  confidence: number
  healthScore: number
  breadthPositivePct: number
  avgChange24h: number
  avgChange7d: number
  volatilityScore: number
  sentimentScore: number
  momentumScore: number
  liquidityScore: number
  technicalScore: number
  riskPosture: "Risk on" | "Neutral" | "Risk off"
  signalSummary: string[]
}

export interface StrategyRequest {
  symbol?: string
  horizon?: "7d" | "30d" | "90d" | "180d"
  riskMode?: RiskMode
  capital?: number
}

export interface SignalCoverage {
  name: string
  source: string
  status: "live" | "derived" | "missing"
  detail: string
}

export interface BacktestRuleSet {
  engine: "regimex-daily-close-v1"
  evaluationInterval: "1d"
  priceSource: "CMC historical quote close"
  indicators: string[]
  entryLogic: string[]
  exitLogic: string[]
  positionSizing: string[]
}

export interface StrategyProof {
  hashAlgorithm: "SHA-256"
  canonicalization: "stable-json-v1 excluding proof.specHash"
  specHash: string
}

export interface StrategySpec {
  id: string
  specVersion: "regimex-strategy-spec/v1"
  title: string
  track: "Track 2 - Strategy Skills"
  generatedAt: string
  dataSource: string
  targetAsset: string
  horizon: NonNullable<StrategyRequest["horizon"]>
  universe: string[]
  regime: RegimeLabel
  confidence: number
  strategy: StrategyName
  strategyFingerprint: string
  riskMode: RiskMode
  thesis: string
  signalCoverage: SignalCoverage[]
  entryRules: string[]
  exitRules: string[]
  riskRules: string[]
  backtestRules: BacktestRuleSet
  backtestPlan: string[]
  cmcEndpoints: string[]
  bnbChainUse: string[]
  proof: StrategyProof
  noLiveExecutionNotice: string
}

export interface BacktestPoint {
  t: string
  equity: number
  price?: number
  position?: number
}

export interface BacktestResult {
  mode: "historical" | "quote-proxy" | "unavailable"
  strategy: StrategyName
  symbol: string
  periodDays: number
  returnPct: number
  winRatePct: number
  maxDrawdownPct: number
  sharpe: number
  trades: number
  points: BacktestPoint[]
  notes: string[]
}

export interface AiResearchNote {
  aiStatus: "live" | "missing-key" | "fallback"
  summary: string
  reasoning: string[]
  judgeNotes: string[]
}
