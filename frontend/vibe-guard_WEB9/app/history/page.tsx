'use client'

import { FileCode2, ScrollText, Trash2 } from 'lucide-react'
import { useVibeGuard, type HistoryEntry } from '@/components/vibeguard/app-provider'
import { scoreColor } from '@/lib/vibeguard/severity'
import { ClientTime } from '@/components/vibeguard/client-time'

// Static demo rows shown when the user has not run any live scans yet.
const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: 'sample-1',
    file: 'auth-service.ts',
    timestamp: '2026-09-03T14:34:32.907Z',
    score: 40,
    totalFlags: 3,
    live: false,
  },
  {
    id: 'sample-2',
    file: 'payment.py',
    timestamp: '2026-09-02T09:12:04.221Z',
    score: 75,
    totalFlags: 2,
    live: false,
  },
  {
    id: 'sample-3',
    file: 'utils.js',
    timestamp: '2026-09-01T18:47:51.010Z',
    score: 98,
    totalFlags: 1,
    live: false,
  },
]

export default function HistoryPage() {
  const { history, loadReport, clearHistory } = useVibeGuard()
  const rows = history.length > 0 ? history : SAMPLE_HISTORY
  const usingSample = history.length === 0

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cyan">
            <ScrollText className="size-4" />
            Scan Log
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground vg-glow">
            Scan History
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {usingSample
              ? 'Showing sample logs — run an audit to record live scans.'
              : `${history.length} scan${history.length === 1 ? '' : 's'} saved locally.`}
          </p>
        </div>

        {!usingSample && (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Clear History
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/50 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Total Flags</th>
              <th className="px-4 py-3 text-right font-medium">Report</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tone = scoreColor(row.score)
              return (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    <ClientTime value={row.timestamp} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <FileCode2 className="size-4 text-cyan" />
                      {row.file}
                      {row.live && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                          Live
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm font-bold ${tone.text}`}>
                      {row.score}
                    </span>
                    <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                      {row.totalFlags}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => loadReport(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
