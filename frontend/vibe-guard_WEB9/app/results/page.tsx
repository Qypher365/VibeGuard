'use client'

import Link from 'next/link'
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react'
import { useVibeGuard } from '@/components/vibeguard/app-provider'
import { ResultsSummary } from '@/components/vibeguard/results-summary'
import { CodeViewer } from '@/components/vibeguard/code-viewer'
import { VulnerabilityCard } from '@/components/vibeguard/vulnerability-card'
import { ClientTime } from '@/components/vibeguard/client-time'
import { SEVERITY_ORDER } from '@/lib/vibeguard/types'

export default function ResultsPage() {
  const {
    scan,
    code,
    fileName,
    view,
    setView,
    confirmedIds,
    handleToggleConfirm,
    handleCopyRedacted,
    handleDownloadReport,
  } = useVibeGuard()

  if (!scan) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <ShieldCheck className="size-10 text-cyan" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          No audit data yet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run an audit from the home page to see your security scorecard here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20"
        >
          <ArrowLeft className="size-4" />
          Back to audit engine
        </Link>
      </main>
    )
  }

  const sortedFlags = [...scan.flags].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  )

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6">
      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cyan">
            <span
              className="inline-block size-1.5 rounded-full bg-emerald-400 engine-pulse"
              aria-hidden
            />
            Live Engine Report
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground vg-glow">
            Audit Results
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {scan.file} · <ClientTime value={scan.timestamp} />
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:border-cyan/40 hover:text-cyan"
        >
          <Download className="size-4" />
          Download Report
        </button>
      </div>

      {/* Summary cards */}
      <ResultsSummary summary={scan.summary} />

      {/* Split view */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: code editor */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
          <CodeViewer
            fileName={fileName || scan.file}
            input={code}
            redacted={scan.redacted_code}
            view={view}
            onViewChange={setView}
            onCopyRedacted={handleCopyRedacted}
          />
        </div>

        {/* Right: vulnerability scorecards */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Detected Vulnerabilities
            </h2>
            <span className="rounded-md border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
              {confirmedIds.size} / {scan.summary.totalFlags} confirmed
            </span>
          </div>

          {sortedFlags.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-16 text-center">
              <ShieldCheck className="size-10 text-emerald-400" />
              <p className="mt-3 text-sm font-semibold text-emerald-400">
                No vulnerabilities detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This file passed all VibeGuard security engines.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFlags.map((flag) => (
                <VulnerabilityCard
                  key={flag.id}
                  flag={flag}
                  confirmed={confirmedIds.has(flag.id)}
                  onToggleConfirm={handleToggleConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}