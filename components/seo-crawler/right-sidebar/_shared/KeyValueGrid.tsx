import React from 'react'
import { SourceChip, type SourceTier } from './SourceChip'
import { FreshnessChip, type Freshness } from './FreshnessChip'

export type KvItem = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral';
  source?: SourceTier;
  freshness?: Freshness;
}

export function KeyValueGrid({ items, cols = 2 }: { items: ReadonlyArray<KvItem>; cols?: 2 | 3 | 4 }) {
  const grid = cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
  return (
    <div className={`grid ${grid} gap-2`}>
      {items.map(it => (
        <div key={it.label} className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wide text-[#666]">{it.label}</div>
            <div className="flex gap-0.5">
              <SourceChip tier={it.source} />
              <FreshnessChip value={it.freshness} />
            </div>
          </div>
          <div className={`text-[14px] font-mono font-bold ${TONE_FG[it.tone || 'neutral']}`}>{it.value}</div>
          {it.hint && <div className="text-[10px] text-[#666] mt-0.5">{it.hint}</div>}
        </div>
      ))}
    </div>
  )
}

const TONE_FG: Record<NonNullable<KvItem['tone']>, string> = {
  good: 'text-emerald-400', warn: 'text-amber-400', bad: 'text-[#F5364E]',
  info: 'text-sky-400', neutral: 'text-white',
}
