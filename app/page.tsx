"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight, BrainCircuit, ChartCandlestick, DatabaseZap, ShieldCheck, WalletCards } from "lucide-react"
import { IntroAnimation, HERO_REVEAL_MS } from "@/components/intro-animation"
import { MobileNav } from "@/components/mobile-nav"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { StackingAgentCards } from "@/components/stacking-agent-cards"
import { DevExSection } from "@/components/devex-section"
import { LiveAgentFeed } from "@/components/live-agent-feed"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/[0.04] px-3 py-1 text-[11px] tracking-widest text-black/40">
      {children}
    </span>
  )
}

function SurfaceCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: typeof BrainCircuit
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-black/[0.07] bg-white/70 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.14] hover:bg-white"
    >
      <Icon className="h-6 w-6 text-black/45 transition-colors group-hover:text-black" />
      <h3 className="mt-7 text-xl font-light">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-black/45">{description}</p>
      <span className="mt-7 inline-flex items-center gap-2 text-sm text-black/45 transition-colors group-hover:text-black">
        Open surface <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

export default function RegimeXHome() {
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const handleIntroDone = useCallback(() => setHeroReady(true), [])

  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <IntroAnimation onDone={handleIntroDone} />
      <MobileNav />

      <section className="relative h-dvh overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/footer.png"
          className="absolute inset-0 z-0 hidden h-full w-full object-cover md:block"
          src="/media/regimex-hero.mp4"
          style={{
            transform: videoReady ? "scale(1.05)" : "scale(0.85)",
            transition: "transform 2s var(--ease-out)",
          }}
        />
        <img
          src="/images/footer.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center md:hidden"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 h-[68%] bg-gradient-to-t from-[var(--color-paper)] via-[rgba(245,244,240,0.78)] to-transparent" />
        <div
          className="absolute inset-x-0 bottom-0 z-10 h-[42%] pointer-events-none"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 z-20 max-w-5xl px-6 pb-12 md:px-12">
          <div
            className="mb-5 font-pixel text-xs tracking-[0.28em] text-black/45"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(12px)",
              transform: heroReady ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.8s var(--ease-out), filter 0.8s var(--ease-out), transform 0.8s var(--ease-out)",
            }}
          >
            REGIMEX AI
          </div>
          <h1
            className="max-w-4xl text-6xl font-light leading-[0.98] sm:text-7xl md:text-8xl"
            style={{
              fontFamily: "var(--font-display)",
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(24px)",
              transform: heroReady ? "translateY(0)" : "translateY(32px)",
              transition: "opacity 1s var(--ease-out), filter 1s var(--ease-out), transform 1s var(--ease-out)",
            }}
          >
            Detect the market.<br />Deploy the right strategy.
          </h1>
          <div
            className="mt-9 flex flex-col gap-3 sm:flex-row"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s var(--ease-out) 120ms, transform 0.8s var(--ease-out) 120ms",
            }}
          >
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm text-white transition-colors hover:bg-black/80">
              Open Regime Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/strategy-center" className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/50 px-5 py-3 text-sm text-black/65 backdrop-blur transition-colors hover:border-black/20 hover:text-black">
              Generate Strategy Skill
            </Link>
          </div>
        </div>
      </section>

      <section id="platform" className="px-6 py-28 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <PixelIcon type="platform" size={40} />
          <div className="mt-4"><Tag>TRACK 2 STRATEGY SKILLS</Tag></div>
          <RevealText className="mt-5 text-4xl font-light leading-[1.05] md:text-6xl">
            {"A CMC-powered quant agent\nfor regime-aware strategy specs."}
          </RevealText>

          <div className="mt-16 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SurfaceCard href="/market-intelligence" icon={DatabaseZap} title="Market Intelligence" description="Live CoinMarketCap quotes, global metrics, Fear & Greed, DEX network context, and mover breadth." />
            <SurfaceCard href="/strategy-center" icon={BrainCircuit} title="Strategy Center" description="Generate a deterministic Track 2 skill output with entry, exit, risk, and replay rules." />
            <SurfaceCard href="/backtesting-lab" icon={ChartCandlestick} title="Backtesting Lab" description="Replay strategy logic against historical CMC data, with a transparent proxy when plan access is limited." />
            <SurfaceCard href="/proof" icon={WalletCards} title="BNB Chain Proof" description="Hash the final strategy JSON and anchor the proof as transaction calldata through your wallet." />
          </div>
        </div>
      </section>

      <section id="agents" className="border-t border-black/[0.06] px-6 py-28 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <PixelIcon type="agents" size={40} />
          <div className="mt-4"><Tag>AGENT STACK</Tag></div>
          <RevealText className="mt-5 text-4xl font-light leading-[1.05] md:text-5xl">
            {"Six specialist agents.\nOne strategy decision."}
          </RevealText>
          <div className="mt-14">
            <StackingAgentCards />
          </div>
        </div>
      </section>

      <DevExSection />

      <section id="live" className="border-t border-black/[0.06] px-6 py-28 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <PixelIcon type="workflow" size={40} />
            <div className="mt-4"><Tag>LIVE PIPELINE</Tag></div>
            <RevealText className="mt-5 text-4xl font-light leading-[1.05] md:text-5xl">
              {"Signals move through\nan auditable agent feed."}
            </RevealText>
            <p className="mt-6 max-w-md text-sm leading-6 text-black/45">
              Every generated strategy spec keeps its data sources, reasoning, replay plan, and optional BNB Chain proof together.
            </p>
          </div>
          <LiveAgentFeed />
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-black/[0.06] px-6 py-28 md:px-12 lg:px-20">
        <img src="/images/footer.png" alt="" aria-hidden="true" className="absolute bottom-0 left-0 w-full object-cover object-bottom opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-paper)] via-[rgba(245,244,240,0.86)] to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-black/45" />
          <h2 className="mt-6 text-4xl font-light leading-[1.05] md:text-6xl">Built for judges to verify.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-black/45">
            CMC endpoints are server-side, strategy output is downloadable, backtests are reproducible, and the spec hash can be anchored on BNB Chain.
          </p>
          <Link href="/skill-spec" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm text-white transition-colors hover:bg-black/80">
            Inspect Skill Spec <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <span className="font-pixel text-xs tracking-[0.25em] text-black/50">REGIMEX</span>
          <span className="text-xs text-black/30">Track 2 Strategy Skills · CMC API · BNB Chain Proof</span>
        </div>
      </footer>
    </div>
  )
}
