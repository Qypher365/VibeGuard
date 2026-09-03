import type { Severity, Engine } from './types'

interface SeverityStyle {
  label: string // UPPERCASE display label for the badge
  badge: string // classes for the severity pill
  dot: string // solid color class for the accent bar
  text: string
}

// Keyed by the contract's lowercase severity values.
export const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  critical: {
    label: 'CRITICAL',
    badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-500',
    text: 'text-red-400',
  },
  high: {
    label: 'HIGH',
    badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-500',
    text: 'text-orange-400',
  },
  medium: {
    label: 'MEDIUM',
    badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    dot: 'bg-yellow-500',
    text: 'text-yellow-400',
  },
  low: {
    label: 'LOW',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-500',
    text: 'text-blue-400',
  },
}

// Human-friendly label for a flag's engine. Falls back to a titled raw value.
const KNOWN_ENGINE_LABELS: Record<string, string> = {
  registry: 'Registry Engine',
  secret: 'Secret Engine',
  semantic: 'Semantic Engine',
}

export function engineLabel(engine?: string): string {
  if (!engine) return 'Security Engine'
  return (
    KNOWN_ENGINE_LABELS[engine] ??
    `${engine.charAt(0).toUpperCase()}${engine.slice(1)} Engine`
  )
}

export function scoreColor(score: number): {
  ring: string
  text: string
  glow: string
  label: string
} {
  if (score > 80)
    return {
      ring: 'text-emerald-400',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]',
      label: 'Secure',
    }
  if (score > 50)
    return {
      ring: 'text-yellow-400',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_24px_-6px_rgba(234,179,8,0.55)]',
      label: 'At Risk',
    }
  return {
    ring: 'text-red-400',
    text: 'text-red-400',
    glow: 'shadow-[0_0_24px_-6px_rgba(239,68,68,0.6)]',
    label: 'Critical',
  }
}
