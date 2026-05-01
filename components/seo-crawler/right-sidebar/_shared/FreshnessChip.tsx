import React from 'react'

export type Freshness = 'live' | 'recent' | 'fresh' | 'ok' | 'stale' | 'unknown'

const META: Record<Freshness, { label: string; tone: string }> = {
  live:    { label: 'Updated seconds ago', tone: 'text-emerald-400' },
  recent:  { label: 'Updated today',       tone: 'text-emerald-400' },
  fresh:   { label: 'This week',           tone: 'text-sky-400' },
  ok:      { label: 'This month',          tone: 'text-amber-400' },
  stale:   { label: 'Older than 30 days',  tone: 'text-[#F5364E]' },
  unknown: { label: 'Freshness unknown',   tone: 'text-[#666]' },
}

export function FreshnessChip({ value }: { value?: Freshness }) {
  if (!value || value === 'unknown') return null
  const m = META[value]
  return <span className={`text-[10px] ${m.tone}`} title={m.label}>{value === 'stale' ? '⟲' : '·'}</span>
}
