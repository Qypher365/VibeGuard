'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Layers, FileCode, Sparkles } from 'lucide-react'
import { LandingDropzone } from '@/components/vibeguard/landing-dropzone'
import { FeatureCards } from '@/components/vibeguard/feature-cards'
import { AnimatedHeroTitle } from '@/components/vibeguard/animated-hero-title'
import { useVibeGuard } from '@/components/vibeguard/app-provider'

export default function LandingPage() {
  const router = useRouter()
  const vibeCtx = useVibeGuard()
  const [uploading, setUploading] = useState(false)

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    try {
      const allowedExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.env', '.txt']
      const fileArray = Array.from(files)

      const filteredFiles = fileArray.filter((file) => {
        const path = (file as any).webkitRelativePath || file.name
        if (
          path.includes('node_modules/') || 
          path.includes('.git/') || 
          path.includes('.next/') ||
          path.includes('dist/') ||
          path.includes('build/')
        ) return false
        return allowedExts.some((ext) => file.name.toLowerCase().endsWith(ext))
      })

      const targetFiles = filteredFiles.length > 0 ? filteredFiles : fileArray

      const rawPayload = await Promise.all(
        targetFiles.slice(0, 30).map(async (file) => {
          try {
            const content = await file.text()
            if (!content || !content.trim()) return null
            const relPath = (file as any).webkitRelativePath || file.name
            return { filename: relPath, code: content }
          } catch (readErr) {
            return null
          }
        })
      )
      const filePayload = rawPayload.filter(Boolean) as { filename: string; code: string }[]

      if (filePayload.length === 0) {
        alert('No readable text or code files were found in the selection.')
        setUploading(false)
        return
      }

      const combinedRawCode = filePayload
        .map((f) => `// ==========================================\n// FILE: ${f.filename}\n// ==========================================\n\n${f.code}`)
        .join('\n\n')

      const res = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          files: filePayload,
          filename: `Batch (${filePayload.length} files)`,
          code: combinedRawCode
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const finalDisplayCode = data.redacted_code || combinedRawCode

        try {
          localStorage.setItem('vibeguard_last_scan', JSON.stringify(data))
          localStorage.setItem('vibeguard_multi_code', finalDisplayCode)
          localStorage.setItem('vibeguard_files', JSON.stringify(filePayload))
          sessionStorage.setItem('vibeguard_last_scan', JSON.stringify(data))
        } catch (e) {}

        if (vibeCtx?.setCode) vibeCtx.setCode(finalDisplayCode)
        if (vibeCtx?.setFileName) vibeCtx.setFileName(`Batch (${filePayload.length} files)`)
        if (vibeCtx?.setView) vibeCtx.setView('output')
        if (vibeCtx?.setLive) vibeCtx.setLive(true)

        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new CustomEvent('vibeguard_scan_complete', { detail: data }))
        
        router.push('/results')
      } else {
        alert(`Server Error ${res.status}: Check backend terminal.`)
      }
    } catch (err) {
      console.error('Multi-file scan error:', err)
      alert('Upload failed: Ensure backend server is running on http://localhost:5000')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 md:py-14">
      <section className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          <Sparkles className="size-3.5" />
          Real-Time Security Engine
        </span>

        <AnimatedHeroTitle className="mt-6" />

        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          AI Code Security &amp; Real-Time Vulnerability Audit Engine
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs font-semibold text-cyan hover:bg-cyan/20 transition-all">
            <Layers className="size-4" />
            {uploading ? 'Processing Directory...' : 'Upload Multi-File Directory Batch'}
            <input
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              className="hidden"
              onChange={handleMultiFileUpload}
            />
          </label>

          <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs font-semibold text-cyan hover:bg-cyan/20 transition-all">
            <FileCode className="size-4" />
            Select Multiple Loose Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleMultiFileUpload}
            />
          </label>

          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Upload className="size-3.5 text-cyan" /> Chrome Extension Integration Active
          </span>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <LandingDropzone />
        </div>
        <div className="lg:col-span-2">
          <FeatureCards />
        </div>
      </section>
    </div>
  )
}