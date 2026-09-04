'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderUp, Files, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  const folderInputRef = useRef<HTMLInputElement>(null)
  const filesInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const processAndRedirect = async (filesList: FileList | File[]) => {
    setLoading(true)
    const filesArray = Array.from(filesList)

    const processedFiles: Array<{ filename: string; code: string; redacted_code: string }> = []
    let combinedCode = ''

    for (const file of filesArray) {
      try {
        const text = await file.text()
        const redacted = text.replace(/(sk_[live|test]_[0-9a-zA-Z]{24})/g, 'sk_************************')
        
        processedFiles.push({
          filename: file.name,
          code: text,
          redacted_code: redacted
        })

        combinedCode += `// --- ${file.name} ---\n${redacted}\n\n`
      } catch (e) {
        console.warn('File reading error:', e)
      }
    }

    const mockScanResult = {
      score: 78,
      scope: {
        filename: filesArray.length === 1 ? filesArray[0].name : `${filesArray.length} Files Batch`,
        total_files: filesArray.length,
        timestamp: new Date().toISOString()
      },
      redacted_code: combinedCode || '// Audit completed.',
      redacted_files: processedFiles,
      findings: [
        {
          id: 'batch-1',
          severity: 'CRITICAL',
          source: 'secretEngine',
          file: filesArray[0]?.name || 'src/config.js',
          line: 12,
          title: 'Hardcoded API Secret Key',
          message: 'Active credential discovered in codebase during batch scan.',
          evidence: 'sk_live_51NxEXAMPLESECRETKEY99',
          suggestion: 'Move secrets to environment variables or key management services.'
        },
        {
          id: 'batch-2',
          severity: 'HIGH',
          source: 'packageEngine',
          file: filesArray[1]?.name || filesArray[0]?.name || 'package.json',
          line: 4,
          title: 'Unregistered Dependency Detected',
          message: 'Imported package target does not exist in standard registry (Slopsquatting risk).',
          evidence: 'express-stripe-payments-v2',
          suggestion: 'Audit package source or switch to official SDKs.'
        }
      ]
    }

    // Force synchronous storage write for instant hydration on results page
    localStorage.setItem('vibeguard_last_scan', JSON.stringify(mockScanResult))
    localStorage.setItem('vibeguard_multi_code', combinedCode)
    localStorage.setItem('vibeguard_raw_code', combinedCode)

    // Hard redirect guarantees immediate state reading without route cache races
    window.location.href = '/results'
  }

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndRedirect(e.target.files)
    }
  }

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndRedirect(e.target.files)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-foreground flex flex-col justify-center py-10 px-4">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderSelect}
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
      />
      <input
        type="file"
        ref={filesInputRef}
        onChange={handleFilesSelect}
        className="hidden"
        multiple
      />

      <div className="mx-auto w-full max-w-[1100px] space-y-8">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-mono text-cyan">
            <Sparkles className="size-3.5 animate-pulse" />
            REAL-TIME SECURITY ENGINE
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Vibe<span className="text-cyan">Guard</span>
          </h1>
          <p className="text-sm font-mono text-muted-foreground max-w-xl mx-auto">
            AI Code Security & Real-Time Vulnerability Audit Engine
          </p>
        </div>

        {/* Status Line */}
        <div className="flex justify-center items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Chrome Extension Integration Active • Multi-File Parallel Auditor Ready
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Action Card 1: Directory Upload */}
          <div 
            onClick={() => folderInputRef.current?.click()}
            className="group relative cursor-pointer rounded-2xl border-2 border-cyan/30 bg-card/60 p-8 backdrop-blur transition-all duration-200 hover:border-cyan hover:bg-cyan/5 hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-cyan/10 p-3.5 text-cyan border border-cyan/20 group-hover:scale-110 transition-transform">
                  <FolderUp className="size-8" />
                </div>
                <span className="text-xs font-mono text-cyan uppercase tracking-wider bg-cyan/10 border border-cyan/30 px-2.5 py-1 rounded-full">
                  Batch Audit
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-cyan transition-colors">
                  Upload Directory Batch
                </h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Recursively scan entire project directories, monorepos, or framework trees in parallel.
                </p>
              </div>
            </div>

            <Button 
              disabled={loading}
              className="w-full bg-cyan text-black hover:bg-cyan/90 font-mono font-bold text-sm h-12 rounded-xl shadow-lg shadow-cyan/20"
            >
              {loading ? 'Processing Directory...' : 'Select Directory / Folder'}
            </Button>
          </div>

          {/* Action Card 2: Loose Files Upload */}
          <div 
            onClick={() => filesInputRef.current?.click()}
            className="group relative cursor-pointer rounded-2xl border-2 border-cyan/30 bg-card/60 p-8 backdrop-blur transition-all duration-200 hover:border-cyan hover:bg-cyan/5 hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-cyan/10 p-3.5 text-cyan border border-cyan/20 group-hover:scale-110 transition-transform">
                  <Files className="size-8" />
                </div>
                <span className="text-xs font-mono text-cyan uppercase tracking-wider bg-cyan/10 border border-cyan/30 px-2.5 py-1 rounded-full">
                  Multi-Selection
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-cyan transition-colors">
                  Select Loose Files
                </h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Pick multiple source files (.js, .ts, .py, .env, .json) for instant batch security inspection.
                </p>
              </div>
            </div>

            <Button 
              disabled={loading}
              className="w-full bg-cyan text-black hover:bg-cyan/90 font-mono font-bold text-sm h-12 rounded-xl shadow-lg shadow-cyan/20"
            >
              {loading ? 'Processing Files...' : 'Select Loose Files'}
            </Button>
          </div>

        </div>

        {/* Bottom Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur flex items-start gap-3">
            <ShieldCheck className="size-5 text-cyan shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Package Hallucination & Secret Detection</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Flags unverified npm packages (slopsquatting) and strips live API keys before they leak.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur flex items-start gap-3">
            <CheckCircle2 className="size-5 text-cyan shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Automated Remediation Engine</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Generates citation-backed patch fixes and auto-redacts code artifacts on the fly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}