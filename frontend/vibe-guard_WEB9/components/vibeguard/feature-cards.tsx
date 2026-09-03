'use client'

import { CheckCircle2, KeyRound, PackageX, ShieldCheck, Wrench } from 'lucide-react'

export function FeatureCards() {
  return (
    <div className="flex flex-col gap-4">
      {/* Card 1 — Package Hallucination & Secret Detection */}
      <article className="float-card group relative overflow-hidden rounded-xl border border-border bg-card/70 p-5 backdrop-blur-md transition-colors hover:border-cyan/40">
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-cyan/10 blur-2xl" />
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
            <ShieldCheck className="size-5 text-cyan" strokeWidth={2.2} />
          </div>
          <h3 className="text-sm font-semibold text-foreground text-balance">
            Package Hallucination &amp; Secret Detection
          </h3>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Flags imports that don&apos;t exist on npm and catches leaked API
          keys, tokens, and credentials before they ship.
        </p>

        {/* mini shield preview */}
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-panel/60 px-3 py-2.5 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400">
            <PackageX className="size-3" />
            hallucinated-pkg
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400">
            <KeyRound className="size-3" />
            sk_live_████
          </span>
        </div>
      </article>

      {/* Card 2 — Automated Remediation Engine */}
      <article className="float-card group relative overflow-hidden rounded-xl border border-border bg-card/70 p-5 backdrop-blur-md transition-colors [animation-delay:1.5s] hover:border-cyan/40">
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-indigo/10 blur-2xl" />
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-indigo/40 bg-indigo/10">
            <Wrench className="size-5 text-indigo" strokeWidth={2.2} />
          </div>
          <h3 className="text-sm font-semibold text-foreground text-balance">
            Automated Remediation Engine
          </h3>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Every finding ships with a verified, citation-backed fix so you can
          patch vulnerabilities in a single click.
        </p>

        {/* npm verification badge */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-panel/60 px-3 py-2.5 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="rounded bg-[#cb3837] px-1.5 py-0.5 text-[10px] font-bold text-white">
              npm
            </span>
            registry verified
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-400">
            <CheckCircle2 className="size-3" />
            200 OK
          </span>
        </div>
      </article>
    </div>
  )
}
