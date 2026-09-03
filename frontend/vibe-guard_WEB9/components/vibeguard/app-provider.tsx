'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { ScanResult } from '@/lib/vibeguard/types'
import { calculateSecurityScore } from '@/lib/vibeguard/types'
import { runAudit } from '@/lib/vibeguard/scan'
import { SAMPLE_CODE, SAMPLE_SCAN } from '@/lib/vibeguard/sample'
import { CyberLoader } from './cyber-loader'

const HISTORY_KEY = 'vibeguard:history:v1'
const MAX_HISTORY = 50

export interface HistoryEntry {
  id: string
  file: string
  timestamp: string
  score: number
  totalFlags: number
  live: boolean
  // Full report payload so "View Report" can reload this exact scan.
  scan?: ScanResult
  code?: string
  fileName?: string
}

interface VibeGuardContextValue {
  code: string
  setCode: (v: string) => void
  fileName: string
  setFileName: (v: string) => void
  scan: ScanResult | null
  loading: boolean
  live: boolean
  view: 'input' | 'output'
  setView: (v: 'input' | 'output') => void
  confirmedIds: Set<string>
  history: HistoryEntry[]
  confirmedCount: number
  totalFlags: number
  handleRun: () => Promise<void>
  handleToggleConfirm: (id: string, confirmed: boolean) => void
  handleCopyRedacted: () => void
  handleDownloadReport: () => void
  loadReport: (entry: HistoryEntry) => void
  clearHistory: () => void
}

const VibeGuardContext = createContext<VibeGuardContextValue | null>(null)

export function VibeGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [fileName, setFileName] = useState('test.js')
  const [scan, setScan] = useState<ScanResult | null>(SAMPLE_SCAN)
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState(false)
  const [view, setView] = useState<'input' | 'output'>('input')
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())

  // Persisted rolling history of scans (hydrated from localStorage).
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate history from localStorage on first mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[]
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // Corrupt or unavailable storage — start fresh.
    } finally {
      setHydrated(true)
    }
  }, [])

  // Persist history whenever it changes (after initial hydration).
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      // Storage full / unavailable — silently ignore.
    }
  }, [history, hydrated])

  const handleRun = useCallback(async () => {
    setLoading(true)
    setScan(null)
    setConfirmedIds(new Set())
    try {
      let liveResult: any = null
      try {
        const apiRes = await fetch('http://localhost:5000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: fileName || 'test.js', code }),
        })
        if (apiRes.ok) {
          liveResult = await apiRes.json()
        }
      } catch (apiErr) {
        console.error('Express backend offline or unreachable:', apiErr)
      }
      const { result, live: isLive } = await runAudit(code, SAMPLE_SCAN, {
        file: fileName || 'test.js',
      })
      setScan(result)
      setLive(isLive)
      // seed confirmations from the contract's `confirmed` flags
      setConfirmedIds(
        new Set(result.flags.filter((f) => f.confirmed).map((f) => f.id)),
      )
      setView('output')

      // Record the full report into persisted history.
      const entry: HistoryEntry = {
        id: `${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        file: result.file,
        timestamp: result.timestamp || new Date().toISOString(),
        score: calculateSecurityScore(result.summary),
        totalFlags: result.summary.totalFlags,
        live: isLive,
        scan: result,
        code,
        fileName: fileName || 'test.js',
      }
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))

      if (liveResult) {
        const rawFlags = Array.isArray(liveResult.flags)
          ? liveResult.flags
          : Array.isArray(liveResult.findings)
          ? liveResult.findings
          : []

        const normalizedFlags = rawFlags.map((flag: any, idx: number) => ({
          id: flag.id || flag.ruleId || `flag-${idx}`,
          engine: flag.engine || flag.type || 'secret',
          severity: (flag.severity || 'MEDIUM').toUpperCase(),
          title: flag.title || flag.message || 'Security Risk Detected',
          description: flag.description || flag.message || '',
          line: flag.line || 1,
          snippet: flag.snippet || flag.code || '',
          fix: flag.fix || flag.suggestion || 'Review flagged line for potential risks.',
          confirmed: Boolean(flag.confirmed),
          message: flag.message || flag.title || 'Security Risk Detected',
          explanation: flag.explanation || flag.description || flag.message || '',
          suggestedFix: flag.suggestedFix || flag.fix || flag.suggestion || 'Review flagged line for potential risks.',
          file: flag.file || fileName || 'test.js',
        })).filter((flag: any) => Number(flag.line || 1) <= (code || '').split('\n').length)

        const normalizedSummary = liveResult.summary || {
          totalFlags: normalizedFlags.length,
          critical: liveResult.severityCounts?.CRITICAL ?? 0,
          high: liveResult.severityCounts?.HIGH ?? 0,
          medium: liveResult.severityCounts?.MEDIUM ?? 0,
          low: liveResult.severityCounts?.LOW ?? 0,
        }

        const calcCrit = normalizedFlags.filter((f: any) => f.severity === 'CRITICAL').length
        const calcHigh = normalizedFlags.filter((f: any) => f.severity === 'HIGH').length
        const calcMed = normalizedFlags.filter((f: any) => f.severity === 'MEDIUM').length
        const calcLow = normalizedFlags.filter((f: any) => f.severity === 'LOW').length
        if (normalizedSummary) {
          normalizedSummary.totalFlags = normalizedFlags.length
          normalizedSummary.critical = (normalizedSummary.critical && normalizedSummary.critical > 0) ? normalizedSummary.critical : calcCrit
          normalizedSummary.high = (normalizedSummary.high && normalizedSummary.high > 0) ? normalizedSummary.high : calcHigh
          normalizedSummary.medium = (normalizedSummary.medium && normalizedSummary.medium > 0) ? normalizedSummary.medium : calcMed
          normalizedSummary.low = (normalizedSummary.low && normalizedSummary.low > 0) ? normalizedSummary.low : calcLow
        }

        const normalizedResult: ScanResult = {
          file: liveResult.file || fileName || 'test.js',
          timestamp: liveResult.timestamp || new Date().toISOString(),
          redacted_code: liveResult.redacted_code || code,
          flags: normalizedFlags,
          summary: normalizedSummary,
        }

        setScan(normalizedResult)
        setLive(true)
        setConfirmedIds(
          new Set(
            normalizedResult.flags
              .filter((f) => f.confirmed)
              .map((f) => f.id),
          ),
        )
        const liveEntry: HistoryEntry = {
          id: `${normalizedResult.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          file: normalizedResult.file,
          timestamp: normalizedResult.timestamp,
          score: calculateSecurityScore(normalizedResult.summary),
          totalFlags: normalizedResult.summary.totalFlags,
          live: true,
          scan: normalizedResult,
          code,
          fileName: fileName || 'test.js',
        }
        setHistory((prev) => [liveEntry, ...prev.slice(1)].slice(0, MAX_HISTORY))
      }

      // Route the user to the results view once the audit completes.
      router.push('/results')
    } finally {
      setLoading(false)
    }
  }, [code, fileName, router])

  const loadReport = useCallback(
    (entry: HistoryEntry) => {
      const target: ScanResult = entry.scan ?? {
        ...SAMPLE_SCAN,
        file: entry.file,
        timestamp: entry.timestamp,
      }
      setScan(target)
      setCode(entry.code ?? SAMPLE_CODE)
      setFileName(entry.fileName ?? entry.file)
      setLive(entry.live)
      setConfirmedIds(
        new Set(target.flags.filter((f) => f.confirmed).map((f) => f.id)),
      )
      setView('output')
      router.push('/results')
    },
    [router],
  )

  const clearHistory = useCallback(() => setHistory([]), [])

  const handleToggleConfirm = useCallback((id: string, confirmed: boolean) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev)
      if (confirmed) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleCopyRedacted = useCallback(() => {
    if (scan) navigator.clipboard?.writeText(scan.redacted_code)
  }, [scan])

  const handleDownloadReport = useCallback(() => {
    if (!scan) return
    const report: ScanResult = {
      ...scan,
      flags: scan.flags.map((f) => ({
        ...f,
        confirmed: confirmedIds.has(f.id),
      })),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibeguard-report-${scan.file.replace(/\W+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [scan, confirmedIds])

  const confirmedCount = confirmedIds.size
  const totalFlags = useMemo(() => scan?.flags.length ?? 0, [scan])

  const value = useMemo<VibeGuardContextValue>(
    () => ({
      code,
      setCode,
      fileName,
      setFileName,
      scan,
      loading,
      live,
      view,
      setView,
      confirmedIds,
      history,
      confirmedCount,
      totalFlags,
      handleRun,
      handleToggleConfirm,
      handleCopyRedacted,
      handleDownloadReport,
      loadReport,
      clearHistory,
    }),
    [
      code,
      fileName,
      scan,
      loading,
      live,
      view,
      confirmedIds,
      history,
      confirmedCount,
      totalFlags,
      handleRun,
      handleToggleConfirm,
      handleCopyRedacted,
      handleDownloadReport,
      loadReport,
      clearHistory,
    ],
  )

  return (
    <VibeGuardContext.Provider value={value}>
      {children}
      <CyberLoader active={loading} />
    </VibeGuardContext.Provider>
  )
}

export function useVibeGuard(): VibeGuardContextValue {
  const ctx = useContext(VibeGuardContext)
  if (!ctx) {
    throw new Error('useVibeGuard must be used within a VibeGuardProvider')
  }
  return ctx
}