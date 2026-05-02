import React from 'react'
import { DistRowsBlock } from '..'

export function AnchorMixBlock({ title = 'Anchor mix', mix }: {
  title?: string
  mix: { brand: number; exact: number; partial: number; generic: number; naked: number; image: number }
}) {
  const total = Math.max(1, Object.values(mix).reduce((a, b) => a + b, 0))
  const pct = (n: number) => Math.round((n / total) * 100)
  return (
    <DistRowsBlock title={title} rows={[
      { label: 'Brand',     value: pct(mix.brand),   tone: 'good' as const },
      { label: 'Exact',     value: pct(mix.exact),   tone: 'warn' as const },
      { label: 'Partial',   value: pct(mix.partial), tone: 'info' as const },
      { label: 'Generic',   value: pct(mix.generic), tone: 'warn' as const },
      { label: 'Naked URL', value: pct(mix.naked),   tone: 'info' as const },
      { label: 'Image',     value: pct(mix.image),   tone: 'neutral' as const },
    ]} />
  )
}
