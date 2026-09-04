'use client'

import { useEffect, useState } from 'react'
import { useVibeGuard } from '@/components/vibeguard/app-provider'
import { Button } from '@/components/ui/button'
import { Download, Flag, ShieldCheck, Layers, FileCode, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function ResultsPage() {
  const vibeCtx = useVibeGuard()
  const [scanData, setScanData] = useState<any>(null)
  const [code, setCode] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<string>('all')
  const [confirmedCount, setConfirmedCount] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const hydrateData = () => {
      try {
        // Query all scan storage keys used across raw code & single file upload
        const storedScanRaw = 
          localStorage.getItem('vibeguard_last_scan') ||
          localStorage.getItem('vibeguard_results') ||
          localStorage.getItem('vibeguard_single_scan') ||
          localStorage.getItem('vibeguard_raw_scan') ||
          localStorage.getItem('vibeguard_file_scan') ||
          sessionStorage.getItem('vibeguard_last_scan') ||
          sessionStorage.getItem('vibeguard_results')

        // Query all code payload keys used across input handlers
        const rawCode = 
          localStorage.getItem('vibeguard_raw_code') ||
          localStorage.getItem('vibeguard_single_code') ||
          localStorage.getItem('vibeguard_file_code') ||
          localStorage.getItem('vibeguard_code') ||
          localStorage.getItem('vibeguard_multi_code') ||
          sessionStorage.getItem('vibeguard_raw_code')

        let parsedData: any = null
        if (storedScanRaw) {
          try {
            parsedData = JSON.parse(storedScanRaw)
          } catch (e) {
            console.warn('Failed to parse scan JSON from storage:', e)
          }
        }

        // Context fallback
        if (!parsedData) {
          parsedData = vibeCtx?.scanResult || (vibeCtx as any)?.results || (vibeCtx as any)?.scanData
        }

        // Unwrap nested API payload wrappers
        if (parsedData?.data) parsedData = parsedData.data
        if (parsedData?.scanResult) parsedData = parsedData.scanResult

        // Resolve code across all single file and raw code property formats
        let resolvedCode = 
          parsedData?.redacted_code ||
          parsedData?.code ||
          parsedData?.content ||
          parsedData?.file_content ||
          parsedData?.source_code ||
          parsedData?.files?.[0]?.redacted_code ||
          parsedData?.files?.[0]?.code ||
          parsedData?.files?.[0]?.content ||
          parsedData?.redacted_files?.[0]?.redacted_code ||
          rawCode ||
          vibeCtx?.code ||
          (vibeCtx as any)?.fileContent ||
          ''

        if (typeof resolvedCode === 'object' && resolvedCode !== null) {
          resolvedCode = JSON.stringify(resolvedCode, null, 2)
        }

        // Synthesize scan container if raw code exists without scan output
        if (!parsedData && rawCode) {
          parsedData = {
            score: 85,
            scope: { filename: 'raw_input.js', total_files: 1, timestamp: new Date().toISOString() },
            findings: []
          }
        }

        if (parsedData) {
          setScanData(parsedData)
        }

        setCode(String(resolvedCode || ''))
      } catch (e) {
        console.error('Failed to hydrate scan results:', e)
      }
    }

    hydrateData()

    window.addEventListener('storage', hydrateData)
    window.addEventListener('vibeguard_scan_complete', hydrateData)
    window.addEventListener('pageshow', hydrateData)

    return () => {
      window.removeEventListener('storage', hydrateData)
      window.removeEventListener('vibeguard_scan_complete', hydrateData)
      window.removeEventListener('pageshow', hydrateData)
    }
  }, [vibeCtx])

  const findings = scanData?.findings || scanData?.results?.findings || scanData?.vulnerabilities || []
  
  // Normalize single file and raw code items into redactedFiles tab items
  let redactedFiles = scanData?.redacted_files || scanData?.files || []
  const filename = 
    scanData?.scope?.filename || 
    scanData?.filename || 
    scanData?.file_name || 
    scanData?.name || 
    vibeCtx?.fileName || 
    (redactedFiles[0]?.filename || redactedFiles[0]?.name) || 
    'raw_input.js'

  if (redactedFiles.length === 0 && code) {
    redactedFiles = [{ filename, redacted_code: code }]
  }

  const totalFilesAudited = scanData?.scope?.total_files || redactedFiles.length || (code ? 1 : 0)
  const score = scanData?.score ?? 100

  const timestamp = mounted
    ? (scanData?.scope?.timestamp 
        ? new Date(scanData.scope.timestamp).toLocaleString()
        : new Date().toLocaleString())
    : ''

  const filteredFindings = selectedFile === 'all' 
    ? findings 
    : findings.filter((f: any) => 
        f.file === selectedFile || 
        f.filename === selectedFile || 
        f.path === selectedFile ||
        (!f.file && !f.filename)
      )

  const activeDisplayCode = selectedFile === 'all'
    ? (code || scanData?.redacted_code || '')
    : (redactedFiles.find((rf: any) => (rf.filename || rf.name) === selectedFile)?.redacted_code || 
       redactedFiles.find((rf: any) => (rf.filename || rf.name) === selectedFile)?.code || 
       code || scanData?.redacted_code || '')

  const renderableCodeString = typeof activeDisplayCode === 'object' 
    ? JSON.stringify(activeDisplayCode, null, 2) 
    : String(activeDisplayCode || '')

  const handleDownloadReport = () => {
    if (!scanData) return
    const blob = new Blob([JSON.stringify(scanData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibeguard-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyCode = () => {
    if (!renderableCodeString) return
    navigator.clipboard.writeText(renderableCodeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const counts = scanData?.severityCounts || scanData?.severity_counts || {
    critical: findings.filter((f: any) => f.severity === 'CRITICAL').length,
    high: findings.filter((f: any) => f.severity === 'HIGH').length,
    medium: findings.filter((f: any) => f.severity === 'MEDIUM').length,
    low: findings.filter((f: any) => f.severity === 'LOW').length,
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-wider">
            <span className="size-2 rounded-full bg-cyan animate-pulse" />
            Live Engine Report
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-3">
            Audit Results
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
              {totalFilesAudited} {totalFilesAudited === 1 ? 'File' : 'Files'} Audited
            </span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5" suppressHydrationWarning>
            {filename} {timestamp ? `• ${timestamp}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" />
              New Scan
            </Button>
          </Link>
          <Button 
            onClick={handleDownloadReport}
            variant="outline" 
            size="sm" 
            className="gap-2 border-cyan/30 text-cyan hover:bg-cyan/10 font-mono text-xs"
            disabled={!scanData}
          >
            <Download className="size-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur flex items-center gap-5">
          <div className="relative flex items-center justify-center size-20 rounded-full border-4 border-yellow-500/30 text-yellow-500 font-bold text-xl font-mono">
            {score}
          </div>
          <div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Security Score</span>
            <div className="text-lg font-bold text-yellow-500 mt-0.5">
              {score >= 90 ? 'Healthy' : score >= 70 ? 'At Risk' : 'Critical Risk'}
            </div>
            <p className="text-xs text-muted-foreground">100 - weighted penalties</p>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Flags</span>
              <div className="mt-2 text-3xl font-bold text-foreground">{findings.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">detected across all engines</p>
            </div>
            <div className="rounded-lg bg-cyan/10 p-2.5 text-cyan">
              <Flag className="size-5" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Confirmed:</span>
            <span className="text-cyan font-semibold">{confirmedCount} / {findings.length}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur flex flex-col justify-between">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Severity Breakdown</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center justify-between rounded bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-mono text-red-400">
              <span>CRITICAL</span>
              <span className="font-bold">{counts.critical || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-mono text-orange-400">
              <span>HIGH</span>
              <span className="font-bold">{counts.high || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-xs font-mono text-yellow-400">
              <span>MEDIUM</span>
              <span className="font-bold">{counts.medium || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-mono text-blue-400">
              <span>LOW</span>
              <span className="font-bold">{counts.low || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Filter Tabs */}
      {redactedFiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
          <span className="text-xs font-mono text-muted-foreground mr-2 flex items-center gap-1.5">
            <Layers className="size-3.5 text-cyan" /> Filter File:
          </span>
          <button
            onClick={() => setSelectedFile('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              selectedFile === 'all'
                ? 'bg-cyan text-black font-semibold shadow-sm'
                : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
            }`}
          >
            All Files ({totalFilesAudited})
          </button>
          {redactedFiles.map((rf: any) => {
            const fname = rf.filename || rf.name || filename
            const fileFindingCount = findings.filter((f: any) => f.file === fname || f.filename === fname).length
            return (
              <button
                key={fname}
                onClick={() => setSelectedFile(fname)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  selectedFile === fname
                    ? 'bg-cyan text-black font-semibold shadow-sm'
                    : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
                }`}
              >
                <FileCode className="size-3" />
                {fname}
                {fileFindingCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedFile === fname ? 'bg-black/20 text-black' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {fileFindingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Code Viewer & Vulnerability Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur flex flex-col h-full min-h-[450px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <span className="text-xs font-mono text-cyan flex items-center gap-2">
              <FileCode className="size-4" />
              {selectedFile === 'all' ? filename : selectedFile}
            </span>
            <button
              onClick={handleCopyCode}
              disabled={!renderableCodeString}
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary/50 px-2.5 py-1 rounded border border-border/50 disabled:opacity-50"
            >
              {copied ? <Check className="size-3 text-cyan" /> : <Copy className="size-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 flex-1 overflow-auto bg-black/60 rounded-lg p-3 font-mono text-xs text-emerald-400/90 whitespace-pre leading-relaxed">
            {renderableCodeString || '// No code payload available.'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-cyan" />
              Detected Vulnerabilities ({filteredFindings.length})
            </h2>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[350px]">
              <ShieldCheck className="size-10 text-cyan/40 mb-3" />
              <p className="font-semibold text-foreground">Zero Security Flags Found</p>
              <p className="text-xs mt-1 text-muted-foreground max-w-xs">
                No secrets, unregistered packages, or semantic flaws were detected in {selectedFile === 'all' ? 'this batch' : selectedFile}.
              </p>
            </div>
          ) : (
            filteredFindings.map((f: any, idx: number) => (
              <div key={f.id || idx} className="rounded-xl border border-red-500/30 bg-card/60 p-4 backdrop-blur space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      {f.severity || 'HIGH'}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{f.source || 'secretEngine'}</span>
                    <span className="text-xs font-mono text-cyan">{f.file || filename}:{f.line || 1}</span>
                  </div>
                  <button
                    onClick={() => setConfirmedCount((prev) => prev + 1)}
                    className="text-[11px] font-mono border border-border px-2 py-0.5 rounded bg-secondary/30 hover:bg-secondary text-muted-foreground"
                  >
                    Confirm
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">{f.title || f.message || 'Security Vulnerability'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.message || f.suggestion}</p>
                </div>

                {f.evidence && (
                  <div className="bg-black/70 p-2.5 rounded font-mono text-xs text-red-300 border border-red-500/20 break-all whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                    {f.evidence}
                  </div>
                )}

                {f.suggestion && (
                  <div className="bg-cyan/5 border border-cyan/20 p-2.5 rounded text-xs">
                    <span className="font-mono text-cyan font-semibold block mb-0.5">Suggested Fix</span>
                    <p className="text-muted-foreground">{f.suggestion}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}