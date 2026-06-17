"use client"

import { useEffect, useRef, useState } from "react"

const AGENTS = [
  {
    label: "REGIME",
    title: "Market regime agent",
    desc: "Reads CoinMarketCap price, volume, breadth, and global market metrics to classify expansion, compression, drawdown, or volatility rotation.",
    stats: [{ v: "CMC", l: "market data" }, { v: "live", l: "source mode" }],
    signal: [72, 66, 58, 42, 39, 44, 52],
  },
  {
    label: "SENTIMENT",
    title: "Fear & Greed agent",
    desc: "Adds CMC sentiment context so the strategy skill knows when momentum is supported by risk appetite or contradicted by fear.",
    stats: [{ v: "CMC", l: "optional" }, { v: "clear", l: "fallback" }],
    signal: [30, 36, 41, 48, 45, 52, 49],
  },
  {
    label: "ARCHITECT",
    title: "Strategy architect agent",
    desc: "Turns the regime classification into entry rules, exit rules, risk caps, and a no-look-ahead backtest plan.",
    stats: [{ v: "JSON", l: "spec output" }, { v: "SKILL", l: "contract" }],
    signal: [20, 28, 46, 63, 78, 71, 82],
  },
  {
    label: "PROOF",
    title: "BNB Chain proof agent",
    desc: "Hashes the final strategy JSON and prepares an on-chain calldata transaction so the output can be verified later.",
    stats: [{ v: "BSC", l: "proof chain" }, { v: "SHA", l: "spec hash" }],
    signal: [15, 32, 32, 54, 54, 73, 90],
  },
]

const STICKY_TOP   = 80   // matches top: 80px on first card
const STICKY_STEP  = 16   // each card stacks 16px lower
const SCALE_STEP   = 0.04 // scale reduction per card stacked on top
const OFFSET_STEP  = 8    // px pushed down per card stacked on top

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  )
}

export function StackingAgentCards() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  // depth[i] = 0..N how many cards are currently stacked on top of card i
  const [depth, setDepth] = useState<number[]>(AGENTS.map(() => 0))

  useEffect(() => {
    function onScroll() {
      const nextDepth = AGENTS.map((_, i) => {
        // Count how many cards j > i are currently in sticky position (i.e. have scrolled past card i)
        let count = 0
        for (let j = i + 1; j < AGENTS.length; j++) {
          const el = cardRefs.current[j]
          if (!el) continue
          const rect = el.getBoundingClientRect()
          const stickyTopJ = STICKY_TOP + j * STICKY_STEP
          // Card j is "on top of" card i when it has reached its sticky position
          if (rect.top <= stickyTopJ + 2) count++
        }
        return count
      })
      setDepth(nextDepth)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="flex flex-col" style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}>
      {AGENTS.map((agent, i) => {
        const d         = depth[i]
        const scale     = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP

        return (
          <div
            key={agent.label}
            ref={el => { cardRefs.current[i] = el }}
            className="sticky mb-4"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform:      `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition:     "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange:     "transform",
              }}
            >
              <div className="group relative bg-[#faf9f7] rounded-2xl border border-black/[0.07] overflow-hidden cursor-pointer">
                <div className="absolute inset-y-0 right-0 hidden w-1/2 pointer-events-none md:block">
                  <SignalField values={agent.signal} />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f7] via-[#faf9f7]/75 to-transparent" />
                </div>

                {/* Text content */}
                <div
                  className="relative z-10 p-8"
                >
                  <div className="md:max-w-[60%]">
                    <div className="flex items-start justify-between mb-6">
                      <Tag>{agent.label}</Tag>
                    </div>
                    <h3 className="text-xl font-light mb-3">{agent.title}</h3>
                    <p className="text-sm text-black/45 leading-relaxed mb-8">{agent.desc}</p>
                  </div>
                  <div className="flex gap-8 pt-6 border-t border-black/[0.06]">
                    {agent.stats.map(s => (
                      <div key={s.l}>
                        <div className="text-2xl font-light">{s.v}</div>
                        <div className="text-[11px] text-black/35 tracking-widest mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 md:hidden">
                    <SignalField values={agent.signal} compact />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SignalField({ values, compact = false }: { values: number[]; compact?: boolean }) {
  const width = 420
  const height = compact ? 120 : 260
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width
    const y = height - (value / 100) * (height - 28) - 14
    return { x, y, value }
  })
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")

  return (
    <div className="relative h-full min-h-[120px] overflow-hidden rounded-xl bg-black/[0.025]">
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(height / 4) * line}
            y2={(height / 4) * line}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        ))}
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="rgba(243,186,47,0.16)" />
        <path d={d} fill="none" stroke="rgba(17,17,13,0.82)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="#f3ba2f" stroke="#11100d" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  )
}
