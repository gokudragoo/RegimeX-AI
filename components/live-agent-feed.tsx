"use client"

import { useEffect, useMemo, useState } from "react"
import type { MarketSnapshot } from "@/lib/regimex/types"
import { shortDateTime } from "@/lib/regimex/format"

const STATUSES = [
  { label: "complete", color: "#60a5fa" },
  { label: "live", color: "#4ade80" },
  { label: "partial", color: "#facc15" },
  { label: "blocked", color: "#f87171" },
]

type AgentRow = {
  id: string
  name: string
  task: string
  region: string
  status: typeof STATUSES[number]
  progress: number
}

function statusFor(ok: boolean, partial = false) {
  if (ok) return STATUSES[1]
  return partial ? STATUSES[2] : STATUSES[3]
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: "100%", height: 2, background: "rgba(0,0,0,0.08)", borderRadius: 9 }}>
      <div style={{
        height: "100%", borderRadius: 9,
        width: `${value}%`,
        background: "rgba(0,0,0,0.35)",
        transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
      }} />
    </div>
  )
}

export function LiveAgentFeed() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch("/api/market", { cache: "no-store" })
        if (!response.ok) throw new Error("Market API returned an error")
        const data = (await response.json()) as MarketSnapshot
        if (active) setSnapshot(data)
      } catch {
        if (active) setError("Market pipeline unavailable")
      }
    }

    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const rows = useMemo<AgentRow[]>(() => {
    if (!snapshot) {
      return [
        { id: "LOAD", name: "market-source", task: error || "Connecting to RegimeX market API", region: "API", status: error ? STATUSES[3] : STATUSES[2], progress: error ? 0 : 35 },
      ]
    }

    const hasListings = snapshot.assets.length > 0
    const hasGlobal = Boolean(snapshot.global)
    const hasFearGreed = Boolean(snapshot.fearGreed)
    const hasDex = snapshot.dexNetworks.length > 0
    const hasErrors = snapshot.source.errors.length > 0

    return [
      {
        id: "CMC-LIST",
        name: "regime-source",
        task: `${snapshot.assets.length} CMC liquid assets loaded`,
        region: "CMC",
        status: statusFor(hasListings),
        progress: hasListings ? 100 : 0,
      },
      {
        id: "GLOBAL",
        name: "market-health",
        task: hasGlobal ? "Global market cap and volume available" : "Global metrics unavailable",
        region: "CMC",
        status: statusFor(hasGlobal),
        progress: hasGlobal ? 100 : 0,
      },
      {
        id: "SENT",
        name: "sentiment",
        task: hasFearGreed ? "Fear & Greed endpoint available" : "Fear & Greed endpoint blocked by plan",
        region: "CMC",
        status: statusFor(hasFearGreed, true),
        progress: hasFearGreed ? 100 : 55,
      },
      {
        id: "DEX",
        name: "bnb-dex",
        task: hasDex ? `${snapshot.dexNetworks.length} DEX networks loaded` : "DEX platform endpoint blocked by plan",
        region: "BSC",
        status: statusFor(hasDex, true),
        progress: hasDex ? 100 : 55,
      },
      {
        id: "SPEC",
        name: "strategy-spec",
        task: "Regime classifier and Strategy Skill generator ready",
        region: "APP",
        status: STATUSES[0],
        progress: 100,
      },
      {
        id: "PROOF",
        name: "proof",
        task: `Latest source refresh ${shortDateTime(snapshot.source.generatedAt)}${hasErrors ? " with explicit partial-data notes" : ""}`,
        region: "BSC",
        status: hasErrors ? STATUSES[2] : STATUSES[0],
        progress: hasErrors ? 82 : 100,
      },
    ]
  }, [error, snapshot])

  return (
    <div style={{
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(255,255,255,0.7)",
    }}>
      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 80px 70px",
        padding: "8px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(0,0,0,0.03)",
      }}>
        {["MODULE", "LIVE STATE", "SOURCE", "STATUS"].map(h => (
          <span key={h} style={{ fontSize: 8, letterSpacing: "0.16em", color: "rgba(0,0,0,0.30)", fontFamily: "monospace" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflow: "hidden" }}>
        {rows.map((row, i) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 80px 70px",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.04)",
              gap: 8,
              alignItems: "center",
              animation: `rowSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms both`,
            }}
          >
            {/* Agent */}
            <div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(0,0,0,0.65)", marginBottom: 1 }}>{row.name}</div>
              <div style={{ fontSize: 7.5, fontFamily: "monospace", color: "rgba(0,0,0,0.25)" }}>{row.id}</div>
            </div>

            {/* Task + progress */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 9, color: "rgba(0,0,0,0.50)", lineHeight: 1.35, marginBottom: 5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{row.task}</div>
              <ProgressBar value={row.progress} />
            </div>

            {/* Region */}
            <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.30)" }}>{row.region}</div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: row.status.color,
                boxShadow: row.status.label === "running" ? `0 0 6px ${row.status.color}` : "none",
                animation: row.status.label === "running" ? "statusPulse 2s ease-in-out infinite" : "none",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.35)" }}>{row.status.label}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
