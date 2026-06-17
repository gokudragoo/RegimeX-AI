import Link from "next/link"
import type { ReactNode } from "react"
import { Activity, BrainCircuit, ChartCandlestick, FlaskConical, GitCompareArrows, Home, ShieldCheck, WalletCards } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/market-intelligence", label: "Market Intelligence", icon: Activity },
  { href: "/strategy-center", label: "Strategy Center", icon: BrainCircuit },
  { href: "/backtesting-lab", label: "Backtesting Lab", icon: FlaskConical },
  { href: "/ai-reasoning", label: "AI Reasoning", icon: ChartCandlestick },
  { href: "/strategy-comparison", label: "Compare", icon: GitCompareArrows },
  { href: "/skill-spec", label: "Skill Spec", icon: ShieldCheck },
  { href: "/proof", label: "On-chain Proof", icon: WalletCards },
]

export function AppShell({
  children,
  title,
  description,
  action,
}: {
  children: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-black/[0.06] bg-[var(--color-paper)]/85 px-5 py-6 backdrop-blur-xl lg:block">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#11100d] text-sm font-bold text-[#f3ba2f]">RX</span>
          <span className="font-pixel text-xs tracking-[0.25em] text-black/70">REGIMEX</span>
        </Link>

        <nav className="mt-10 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-black/50 transition-colors hover:bg-black/[0.04] hover:text-black"
              >
                <Icon className="h-4 w-4 text-black/35 transition-colors group-hover:text-black/70" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 border-t border-black/[0.06] pt-5 text-xs leading-5 text-black/35">
          CMC-powered Strategy Skills for BNB Hack Track 2. Specs are generated for research and backtesting, not live execution.
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[var(--color-paper)]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-pixel text-xs tracking-[0.25em] text-black/70">REGIMEX</Link>
          <Link href="/dashboard" className="rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/60">APP</Link>
        </div>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-9 flex flex-col gap-5 border-b border-black/[0.06] pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="mb-5 inline-flex text-xs text-black/35 transition-colors hover:text-black/65">
                Back to site
              </Link>
              <h1 className="max-w-4xl text-4xl font-light leading-[1.05] md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/45">{description}</p>
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
