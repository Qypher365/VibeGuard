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

  useEffect(() => {
    const hydrateData = () => {
      try {
        const storedScan = localStorage.getItem('vibeguard_last_scan')
        const storedCode = localStorage.getItem('vibeguard_multi_code')
        const sessionScan = sessionStorage.getItem('vibeguard_last_scan')

        let data = null
        if (storedScan) {
          data = JSON.parse(storedScan)
        } else if (sessionScan) {
          data = JSON.parse(sessionScan)
        } else if (vibeCtx?.scanResult || (vibeCtx as any)?.results || (vibeCtx as any)?.scanData) {
          data = vibeCtx.scanResult || (vibeCtx as any).results || (vibeCtx as any).scanData
        }

        if (data) {
          setScanData(data)
          if (storedCode) {
            setCode(storedCode)
          } else if (data.redacted_code) {
            setCode(data.redacted_code)
          } else if (vibeCtx?.code) {
            setCode(vibeCtx.code)
          }
        }
      } catch (e) {
        console.error('Failed to hydrate scan results:', e)
      }
    }

    hydrateData()
    window.addEventListener('storage', hydrateData)
    window.addEventListener('vibeguard_scan_complete', hydrateData)

    return () => {
      window.removeEventListener('storage', hydrateData)
      window.removeEventListener('vibeguard_scan_complete', hydrateData)
    }
  }, [vibeCtx])

  const findings = scanData?.findings || []
  const redactedFiles = scanData?.redacted_files || []
  const score = scanData?.score ?? 100
  const filename = scanData?.scope?.filename || vibeCtx?.fileName || 'Scan Report'
  const timestamp = scanData?.scope?.timestamp 
    ? new Date(scanData.scope.timestamp).toLocaleString()
    : new Date().toLocaleString()

  const filteredFindings = selectedFile === 'all' 
    ? findings 
    : findings.filter((f: any) => f.file === selectedFile || f.filename === selectedFile)

  const activeDisplayCode = selectedFile === 'all'
    ? (code || scanData?.redacted_code || '')
    : (redactedFiles.find((rf: any) => rf.filename === selectedFile)?.redacted_code || code || scanData?.redacted_code || '')

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
    navigator.clipboard.writeText(activeDisplayCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const counts = scanData?.severityCounts || { critical: 0, high: 0, medium: 0, low: 0 }

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
            {scanData?.scope?.total_files && (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
                {scanData.scope.total_files} Files Audited
              </span>
            )}
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {filename} • {timestamp}
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
          >
            <Download className="size-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Security Score */}
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
        
        {/* Total Flags */}
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

        {/* Severity Breakdown */}
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

      {/* Multi-File Filter Tabs */}
      {redactedFiles.length > 1 && (
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
            All Files ({findings.length})
          </button>
          {redactedFiles.map((rf: any) => {
            const fileFindingCount = findings.filter((f: any) => f.file === rf.filename || f.filename === rf.filename).length
            return (
              <button
                key={rf.filename}
                onClick={() => setSelectedFile(rf.filename)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  selectedFile === rf.filename
                    ? 'bg-cyan text-black font-semibold shadow-sm'
                    : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
                }`}
              >
                <FileCode className="size-3" />
                {rf.filename}
                {fileFindingCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedFile === rf.filename ? 'bg-black/20 text-black' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {fileFindingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Code Viewer & Vulnerabilities Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inline Code Viewer */}
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur flex flex-col h-full min-h-[450px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <span className="text-xs font-mono text-cyan flex items-center gap-2">
              <FileCode className="size-4" />
              {selectedFile === 'all' ? filename : selectedFile}
            </span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary/50 px-2.5 py-1 rounded border border-border/50"
            >
              {copied ? <Check className="size-3 text-cyan" /> : <Copy className="size-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 flex-1 overflow-auto bg-black/60 rounded-lg p-3 font-mono text-xs text-emerald-400/90 whitespace-pre leading-relaxed">
            {activeDisplayCode || '// No code payload available.'}
          </div>
        </div>

        {/* Vulnerability Stream */}
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
                      {f.severity || 'CRITICAL'}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{f.source || 'Registry Engine'}</span>
                    <span className="text-xs font-mono text-cyan">{f.file || 'test.js'}:{f.line || 1}</span>
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
                  <div className="bg-black/70 p-2.5 rounded font-mono text-xs text-red-300 border border-red-500/20 overflow-x-auto">
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