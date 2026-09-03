'use client'

import { Check, Copy, FileCode2 } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'

// Matches redaction markers emitted by the engine: blocks of █,
// [REDACTED] tokens, or runs of 3+ asterisks.
const REDACT_TOKEN = /(█+|\[REDACTED\]|\*{3,})/g

/** Wrap detected secret redactions in a glowing red overlay span. */
function renderRedacted(line: string): ReactNode {
  if (!line) return ' '
  const parts = line.split(REDACT_TOKEN)
  return parts.map((part, i) => {
    if (part && REDACT_TOKEN.test(part)) {
      // reset lastIndex because test() on a /g regex is stateful
      REDACT_TOKEN.lastIndex = 0
      return (
        <span
          key={i}
          className="vg-redact font-mono"
          title="Redacted secret / API key"
        >
          {part}
        </span>
      )
    }
    REDACT_TOKEN.lastIndex = 0
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function CodeViewer({
  fileName,
  input,
  redacted,
  view,
  onViewChange,
  onCopyRedacted,
}: {
  fileName: string
  input: string
  redacted: string
  view: 'input' | 'output'
  onViewChange: (v: 'input' | 'output') => void
  onCopyRedacted: () => void
}) {
  const [copied, setCopied] = useState(false)
  const source = view === 'input' ? input : redacted
  const lines = source.split('\n')

  const handleCopy = () => {
    onCopyRedacted()
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-3 py-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <FileCode2 className="size-4 text-cyan" />
          <span className="truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-[#09090b] p-0.5">
            {(['input', 'output'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewChange(mode)}
                aria-pressed={view === mode}
                className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  view === mode
                    ? 'bg-cyan text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'input' ? 'Input' : 'Redacted'}
              </button>
            ))}
          </div>

          {view === 'output' && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-2 py-1 font-mono text-[10px] font-medium text-cyan transition-colors hover:bg-cyan/20"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Code body */}
      <div className="min-h-0 flex-1 overflow-auto bg-[#09090b]">
        <pre className="min-w-full p-0 font-mono text-[12px] leading-relaxed">
          <code className="block">
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span className="sticky left-0 w-10 shrink-0 select-none border-r border-border bg-[#09090b] px-2 text-right text-muted-foreground/50">
                  {i + 1}
                </span>
                <span className="whitespace-pre px-3 text-foreground/90">
                  {view === 'output' ? renderRedacted(line) : line || ' '}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
