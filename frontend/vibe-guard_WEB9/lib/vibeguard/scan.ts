import type { Flag, ScanResult, ScanSummary } from './types'

/**
 * Derive the summary counts from the flags array.
 * Used to fill in the summary if the backend omits it.
 */
export function summarizeFlags(flags: Flag[]): ScanSummary {
  const summary: ScanSummary = {
    totalFlags: flags.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  for (const f of flags) {
    if (f.severity in summary) summary[f.severity]++
  }
  return summary
}

/**
 * Live API integration hook.
 * POSTs { code, file } to the VibeGuard engine and expects the JSON contract back.
 * Falls back to the provided sample scan object if the backend is unreachable.
 */
export async function runAudit(
  code: string,
  fallback: ScanResult,
  opts: { file?: string } = {},
): Promise<{ result: ScanResult; live: boolean }> {
  const file = opts.file ?? 'test.js'

  try {
    const res = await fetch('http://localhost:5000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Contract: POST { code, filename } to the live engine.
      body: JSON.stringify({ code, filename: file }),
      // don't hang forever waiting on a local dev backend
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`Engine responded ${res.status}`)
    const data = (await res.json()) as ScanResult
    return { result: normalizeScan(data, code, file), live: true }
  } catch {
    // Fallback: use the attached sample contract object.
    return {
      result: {
        ...fallback,
        file,
        timestamp: new Date().toISOString(),
      },
      live: false,
    }
  }
}

/** Ensure the object satisfies the contract even if the backend omits fields. */
function normalizeScan(
  data: ScanResult,
  code: string,
  file: string,
): ScanResult {
  const flags = data.flags ?? []
  return {
    timestamp: data.timestamp ?? new Date().toISOString(),
    file: data.file ?? file,
    redacted_code: data.redacted_code ?? code,
    flags,
    summary: data.summary ?? summarizeFlags(flags),
  }
}
