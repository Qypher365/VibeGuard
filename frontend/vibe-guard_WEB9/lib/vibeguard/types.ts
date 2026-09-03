// VIBEGUARD JSON CONTRACT
// The frontend consumes ONLY the final scan object returned by the backend.
//
// Example:
// {
//   "timestamp": "2026-09-03T14:34:32.907Z",
//   "file": "test.js",
//   "summary": { "totalFlags": 1, "critical": 1, "high": 0, "medium": 0, "low": 0 },
//   "redacted_code": "...",
//   "flags": [ ... ]
// }

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type Engine = 'registry' | 'secret' | 'semantic' | (string & {})

// Citation attached to a flag (source of truth for the finding).
export interface Citation {
  source: string
  id: string
  url: string
}

// Every flag MUST use this exact shape (per contract).
export interface Flag {
  id: string
  engine: Engine
  severity: Severity
  file: string
  line: number
  snippet: string
  message: string
  explanation: string
  citation: Citation
  suggestedFix: string
  confirmed: boolean
}

// Summary block: per-severity counts + total.
export interface ScanSummary {
  totalFlags: number
  critical: number
  high: number
  medium: number
  low: number
}

// The final scan object returned by the backend.
export interface ScanResult {
  timestamp: string
  file: string
  summary: ScanSummary
  redacted_code: string
  flags: Flag[]
}

// Severities ordered by descending seriousness (drives sort + rendering order).
export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

// Weighting used to derive the Security Score from the summary counts.
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
}

/**
 * Security Score, per contract:
 * Math.max(0, 100 - (critical*20 + high*10 + medium*5 + low*2))
 */
export function calculateSecurityScore(summary: ScanSummary): number {
  const penalty =
    summary.critical * SEVERITY_WEIGHT.critical +
    summary.high * SEVERITY_WEIGHT.high +
    summary.medium * SEVERITY_WEIGHT.medium +
    summary.low * SEVERITY_WEIGHT.low
  return Math.max(0, 100 - penalty)
}
