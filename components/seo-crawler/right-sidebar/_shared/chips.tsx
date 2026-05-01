import React from 'react'
import type { SourceTier, Freshness, Tone } from './types'

const toneText: Record<Tone, string> = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  bad:  'text-rose-400 bg-rose-500/10 border-rose-500/20',
  info: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  neutral: 'text-[#bbb] bg-[#181818] border-[#262626]',
}

export function StatusChip({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${toneText[tone]}`}>
      {children}
    </span>
  )
}

const tierColor: Record<SourceTier, string> = {
  T0: 'bg-emerald-500', T1: 'bg-emerald-400', T2: 'bg-sky-400',
  T3: 'bg-amber-400',   T4: 'bg-amber-500',   T5: 'bg-rose-500',
  T6: 'bg-fuchsia-400', T7: 'bg-zinc-500',    T8: 'bg-zinc-700',
}

export function SourceChip({ tier, provider }: { tier: SourceTier; provider?: string }) {
  return (
    <span title={`${tier}${provider ? ' · ' + provider : ''}`}
      className="inline-flex items-center gap-1 text-[9px] text-[#666]">
      <span className={`h-1.5 w-1.5 rounded-full ${tierColor[tier]}`} />
      {tier}
    </span>
  )
}

const freshnessLabel: Record<Freshness, { label: string; tone: Tone }> = {
  live:    { label: 'live',    tone: 'good' },
  recent:  { label: 'recent',  tone: 'good' },
  fresh:   { label: 'fresh',   tone: 'info' },
  ok:      { label: 'ok',      tone: 'neutral' },
  stale:   { label: 'stale',   tone: 'warn' },
  unknown: { label: 'unknown', tone: 'neutral' },
}

export function FreshnessChip({ value }: { value: Freshness }) {
  const f = freshnessLabel[value]
  return <StatusChip tone={f.tone}>{f.label}</StatusChip>
}

export function TonePill({ tone = 'neutral', label }: { tone?: Tone; label: string }) {
  return <StatusChip tone={tone}>{label}</StatusChip>
}
