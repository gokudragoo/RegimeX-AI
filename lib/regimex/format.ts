export function formatCurrency(value?: number | null, digits = 2) {
  if (value == null || Number.isNaN(value)) return "--"
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value?: number | null, digits = 2) {
  if (value == null || Number.isNaN(value)) return "--"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)}%`
}

export function formatNumber(value?: number | null, digits = 0) {
  if (value == null || Number.isNaN(value)) return "--"
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value)
}

export function shortDateTime(value?: string) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "--"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
