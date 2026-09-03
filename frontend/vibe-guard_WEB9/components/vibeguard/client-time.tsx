'use client'

import { useEffect, useState } from 'react'

/**
 * Renders a locale-formatted timestamp without causing hydration mismatches.
 * The server and the first client render output a stable ISO-based string;
 * after mount we swap in the visitor's localized format.
 */
export function ClientTime({ value }: { value: number | string }) {
  const [formatted, setFormatted] = useState<string>(() => isoLabel(value))

  useEffect(() => {
    setFormatted(new Date(value).toLocaleString())
  }, [value])

  return (
    <time dateTime={new Date(value).toISOString()} suppressHydrationWarning>
      {formatted}
    </time>
  )
}

function isoLabel(value: number | string) {
  // Deterministic, timezone-independent label used for SSR + first paint.
  return new Date(value).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}
