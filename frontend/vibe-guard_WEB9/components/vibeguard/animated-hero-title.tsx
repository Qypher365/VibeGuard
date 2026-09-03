'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const TEXT = 'VibeGuard'
const INTRO_MS = 900

/**
 * VibeGuard hero wordmark with a chromatic assembly intro.
 * On mount the text splits into cyan/indigo RGB-offset ghost copies that
 * glitch inward and fade, while the base wordmark snaps cleanly into place.
 * Once settled it carries a subtle cyan ambient pulse.
 */
export function AnimatedHeroTitle({ className }: { className?: string }) {
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), INTRO_MS)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <h1
      className={cn(
        'vg-title font-mono text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl',
        className,
      )}
      aria-label={TEXT}
    >
      {/* Chromatic RGB-split ghosts (decorative, only during intro) */}
      {!settled && (
        <>
          <span aria-hidden="true" className="vg-title__ghost vg-title__ghost--cyan">
            {TEXT}
          </span>
          <span aria-hidden="true" className="vg-title__ghost vg-title__ghost--indigo">
            {TEXT}
          </span>
        </>
      )}

      {/* Base wordmark */}
      <span
        aria-hidden="true"
        className={cn(
          'vg-title__base vg-hero-glow text-foreground',
          settled && 'vg-title__base--pulse',
        )}
      >
        <span className="text-cyan">Vibe</span>Guard
      </span>
    </h1>
  )
}
