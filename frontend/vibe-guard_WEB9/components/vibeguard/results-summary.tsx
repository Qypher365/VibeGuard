'use client'

import { Flag as FlagIcon, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { ScanSummary } from '@/lib/vibeguard/types'
import { calculateSecurityScore } from '@/lib/vibeguard/types'
import { SEVERITY_STYLES, scoreColor } from '@/lib/vibeguard/severity'

const SEVERITY_KEYS = ['critical', 'high', 'medium', 'low'] as const

export function ResultsSummary({ summary }: { summary: ScanSummary }) {
  const score = calculateSecurityScore(summary)
  const tone = scoreColor(score)
  const circumference = 2 * Math.PI * 34

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Security Score */}
      <div
        className={`flex items-center gap-4 rounded-xl border border-border bg-card p-5 ${tone.glow}`}
      >
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="6"
              className="stroke-secondary"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={tone.ring}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (score / 100) * circumference}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-xl font-bold ${tone.text}`}>
              {score}
            </span>
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Security Score
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${tone.text}`}>
            {score > 80 ? (
              <ShieldCheck className="size-4" />
            ) : (
              <ShieldAlert className="size-4" />
            )}
            {tone.label}
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            100 − weighted penalties
          </p>
        </div>
      </div>

      {/* Total Flags */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-cyan/25 bg-cyan/10">
          <FlagIcon className="size-8 text-cyan" strokeWidth={1.8} />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Total Flags
          </div>
          <div className="mt-1 font-mono text-3xl font-bold text-foreground">
            {summary.totalFlags}
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            detected across all engines
          </p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Severity Breakdown
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_KEYS.map((key) => {
            const sev = SEVERITY_STYLES[key]
            return (
              <div
                key={key}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${sev.badge}`}
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  {sev.label}
                </span>
                <span className="font-mono text-sm font-bold">
                  {summary[key]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
