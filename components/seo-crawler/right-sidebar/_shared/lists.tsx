import React from 'react'
import type { Tone, RsAction, RsAlert, RsListItem } from './types'
import { StatusChip } from './chips'

export function MetricRow({ label, value, tone = 'neutral' }: { label: React.ReactNode; value: React.ReactNode; tone?: Tone }) {
  const cls = tone === 'good' ? 'text-emerald-300'
           : tone === 'warn' ? 'text-amber-300'
           : tone === 'bad'  ? 'text-rose-300'
           : tone === 'info' ? 'text-sky-300' : 'text-[#ddd]'
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="truncate text-[11px] text-[#888]">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums ${cls}`}>{value}</span>
    </div>
  )
}

export function TopList({ items, max = 6, onSeeAll }: { items: RsListItem[]; max?: number; onSeeAll?: () => void }) {
  const shown = items.slice(0, max)
  return (
    <div className="space-y-1">
      {shown.map(it => (
        <button key={it.id} onClick={it.onClick}
          className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-[#141414]">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-[#ddd]">{it.primary}</div>
            {it.secondary && <div className="truncate text-[10px] text-[#666]">{it.secondary}</div>}
          </div>
          {it.tail && <span className="shrink-0 text-[10px] font-mono tabular-nums text-[#888]">{it.tail}</span>}
        </button>
      ))}
      {items.length > max && onSeeAll && (
        <button onClick={onSeeAll} className="w-full px-1.5 py-1 text-left text-[10px] text-[#888] hover:text-white">
          See all {items.length} →
        </button>
      )}
    </div>
  )
}

export function AlertRow({ alert, onClick }: { alert: RsAlert; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-[#141414]">
      <div className="flex min-w-0 items-center gap-1.5">
        <StatusChip tone={alert.tone}>•</StatusChip>
        <span className="truncate text-[11px] text-[#ddd]">{alert.title}</span>
      </div>
      {alert.count != null && (
        <span className="shrink-0 text-[11px] font-mono tabular-nums text-[#888]">{alert.count}</span>
      )}
    </button>
  )
}

export function ActionRow({ action, onApprove, onDismiss }: { action: RsAction; onApprove?: () => void; onDismiss?: () => void }) {
  return (
    <div className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {action.primary && <StatusChip tone="info">primary</StatusChip>}
            <span className="truncate text-[11px] font-medium text-[#ddd]">{action.title}</span>
          </div>
          {action.reason && <div className="mt-0.5 truncate text-[10px] text-[#666]">{action.reason}</div>}
        </div>
        <div className="shrink-0 text-right">
          {action.forecast && <div className="text-[10px] text-emerald-400">{action.forecast}</div>}
          {action.affected != null && <div className="text-[9px] text-[#666]">{action.affected} pages</div>}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={onApprove}
          className="rounded bg-[#F5364E] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#df3248]">Approve</button>
        <button onClick={onDismiss}
          className="rounded border border-[#222] px-2 py-0.5 text-[10px] text-[#888] hover:text-white">Dismiss</button>
        {action.cta && (
          <button onClick={action.cta.onClick}
            className="rounded border border-[#222] px-2 py-0.5 text-[10px] text-[#888] hover:text-white">{action.cta.label}</button>
        )}
      </div>
    </div>
  )
}

export function DrillChip({ label, count, onClick }: { label: string; count?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded border border-[#222] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#bbb] hover:bg-[#141414] hover:text-white">
      {label}
      {count != null && <span className="font-mono text-[#666]">{count}</span>}
    </button>
  )
}
