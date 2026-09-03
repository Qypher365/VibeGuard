'use client'

import { useEffect, useState } from 'react'
import { ScanLine, ShieldCheck } from 'lucide-react'

const STEPS = [
  'Parsing source tree…',
  'Querying npm registry for hallucinated packages…',
  'Running secret & API-key leak engine…',
  'Cross-referencing CVE + advisory citations…',
  'Compiling security scorecard…',
]

export function CyberLoader({ active }: { active: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) {
      setStep(0)
      return
    }
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 900)
    return () => clearInterval(id)
  }, [active])

  if (!active) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Scanning codebase against npm registry and secret leak engine"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090b]/90 backdrop-blur-md"
    >
      {/* animated scan sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="vg-scan-sweep absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-cyan/10 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        {/* Radar ring */}
        <div className="relative flex size-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-cyan/20" />
          <span className="absolute inset-0 animate-ping rounded-full border border-cyan/30" />
          <span className="absolute inset-2 rounded-full border border-cyan/25" />
          <span
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan"
            style={{ animationDuration: '1.1s' }}
          />
          <div className="flex size-14 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 shadow-[0_0_36px_-4px_rgba(6,182,212,0.8)]">
            <ShieldCheck className="size-7 text-cyan" strokeWidth={2.2} />
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="flex items-center justify-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-cyan vg-glow">
            <ScanLine className="size-4 animate-pulse" />
            Audit Engine Running
          </h2>
          <p className="mt-3 text-pretty font-mono text-[13px] leading-relaxed text-foreground/90">
            Scanning codebase against npm registry &amp; secret leak engine…
          </p>

          {/* Rotating sub-status */}
          <p className="mt-3 h-4 font-mono text-[11px] text-muted-foreground transition-opacity">
            {STEPS[step]}
          </p>

          {/* Progress track */}
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div className="vg-loader-bar h-full w-1/3 rounded-full bg-gradient-to-r from-cyan/40 via-cyan to-cyan/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
