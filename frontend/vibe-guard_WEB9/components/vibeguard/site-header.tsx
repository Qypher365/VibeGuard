'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Inbox, ScrollText, ShieldCheck } from 'lucide-react'
import { useVibeGuard } from './app-provider'

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Inbox },
  { href: '/results', label: 'Results', icon: BarChart3 },
  { href: '/history', label: 'History', icon: ScrollText },
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const { live, history } = useVibeGuard()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[#09090b]/85 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
            <ShieldCheck className="size-5 text-cyan" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-base font-bold tracking-tight text-foreground vg-glow">
              VIBE<span className="text-cyan">GUARD</span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span
                className={`inline-block size-1.5 rounded-full ${
                  live ? 'bg-emerald-400' : 'bg-cyan'
                } engine-pulse`}
                aria-hidden
              />
              {live ? 'Engine Live' : 'Engine Active'}
            </span>
          </div>
        </Link>

        {/* Top navigation pill */}
        <nav
          aria-label="Primary"
          className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-1 backdrop-blur"
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            const badge =
              href === '/history' && history.length > 0 ? history.length : null
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-cyan text-primary-foreground shadow-[0_0_16px_rgba(6,182,212,0.55)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {badge !== null && (
                  <span
                    className={`ml-0.5 flex min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold ${
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'border border-cyan/40 bg-cyan/15 text-cyan'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
