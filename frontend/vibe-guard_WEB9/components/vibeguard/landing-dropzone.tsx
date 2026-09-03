'use client'

import { useCallback, useRef, useState } from 'react'
import {
  FileCode2,
  FileUp,
  Loader2,
  ScanLine,
  Terminal,
  UploadCloud,
  X,
} from 'lucide-react'
import { useVibeGuard } from './app-provider'

type Tab = 'upload' | 'raw'

const ACCEPTED = ['.js', '.py', '.ts', '.txt']
const ACCEPT_ATTR = ACCEPTED.join(',')

function extensionOk(name: string) {
  const lower = name.toLowerCase()
  return ACCEPTED.some((ext) => lower.endsWith(ext))
}

export function LandingDropzone() {
  const { code, setCode, fileName, setFileName, handleRun, loading } =
    useVibeGuard()
  const [tab, setTab] = useState<Tab>('upload')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ingestFile = useCallback(
    (file: File) => {
      if (!extensionOk(file.name)) {
        setError(`Unsupported file. Use ${ACCEPTED.join(', ')}`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setCode(String(reader.result ?? ''))
        setFileName(file.name)
        setUploaded(file.name)
        setError(null)
      }
      reader.onerror = () => setError('Could not read that file.')
      reader.readAsText(file)
    },
    [setCode, setFileName],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) ingestFile(file)
    },
    [ingestFile],
  )

  const clearFile = () => {
    setUploaded(null)
    setCode('')
    setFileName('test.js')
    if (inputRef.current) inputRef.current.value = ''
  }

  const canAudit = code.trim().length > 0 && !loading

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/70 backdrop-blur-md">
      {/* top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />

      <div className="p-5 md:p-6">
        {/* Toggle tabs */}
        <div
          role="tablist"
          aria-label="Input mode"
          className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary/50 p-1"
        >
          <TabButton
            active={tab === 'upload'}
            onClick={() => setTab('upload')}
            icon={<FileUp className="size-3.5" />}
            label="Upload File"
          />
          <TabButton
            active={tab === 'raw'}
            onClick={() => setTab('raw')}
            icon={<Terminal className="size-3.5" />}
            label="Raw Code"
          />
        </div>

        {tab === 'upload' ? (
          <div>
            {uploaded ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
                    <FileCode2 className="size-5 text-cyan" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-foreground">
                      {uploaded}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {code.split('\n').length} lines loaded
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove file"
                  className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    inputRef.current?.click()
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragging
                    ? 'border-cyan bg-cyan/10'
                    : 'border-border bg-panel/40 hover:border-cyan/40 hover:bg-cyan/5'
                }`}
              >
                <div
                  className={`flex size-14 items-center justify-center rounded-full border transition-colors ${
                    dragging
                      ? 'border-cyan/50 bg-cyan/15'
                      : 'border-border bg-secondary/60'
                  }`}
                >
                  <UploadCloud
                    className={`size-7 ${dragging ? 'text-cyan' : 'text-muted-foreground'}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drag &amp; drop your source file
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {ACCEPTED.join('  ·  ')}
                  </p>
                </div>
                <span className="mt-1 inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-xs font-medium text-cyan">
                  <FileUp className="size-3.5" />
                  Browse Files
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) ingestFile(file)
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 flex items-center gap-2 rounded-tl-lg rounded-br-lg border-b border-r border-border bg-secondary/70 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-cyan" />
              {fileName}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="// Paste AI-generated code here…"
              className="thin-scroll h-64 w-full resize-none rounded-lg border border-border bg-panel/60 p-4 pt-9 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/40"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 font-mono text-[11px] text-destructive">{error}</p>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleRun}
          disabled={!canAudit}
          className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg bg-cyan px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_28px_-4px_rgba(6,182,212,0.7)] transition-all hover:shadow-[0_0_40px_-2px_rgba(6,182,212,0.85)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <ScanLine className="size-4 transition-transform group-hover:scale-110" />
              Start Audit Engine
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all ${
        active
          ? 'bg-cyan text-primary-foreground shadow-[0_0_14px_rgba(6,182,212,0.5)]'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
