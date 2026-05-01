import React from 'react'

export type SourceTier =
  | 'official' | 'browser' | 'scrape' | 'ai' | 'estimated' | 'default' | 'cache'

const META: Record<SourceTier, { glyph: string; label: string; tone: string }> = {
  official:  { glyph: '●', label: 'Official source',          tone: 'text-emerald-400' },
  browser:   { glyph: '◐', label: 'Headless browser',          tone: 'text-sky-400' },
  scrape:    { glyph: '◑', label: 'HTML scrape',               tone: 'text-amber-400' },
  ai:        { glyph: '◌', label: 'AI inferred',               tone: 'text-fuchsia-400' },
  estimated: { glyph: '◌', label: 'Estimated (model)',         tone: 'text-amber-400' },
  default:   { glyph: '◌', label: 'Default value',             tone: 'text-[#666]' },
  cache:     { glyph: '◌', label: 'Cached snapshot',           tone: 'text-[#666]' },
}

export function SourceChip({ tier }: { tier?: SourceTier }) {
  if (!tier) return null
  const m = META[tier]
  return <span className={`text-[10px] ${m.tone}`} title={m.label}>{m.glyph}</span>
}
