import React from 'react'
import { Clock, Globe, Layers, Languages } from 'lucide-react'

type Props = {
  scope?: { label: string }
  industry?: string
  cms?: string
  language?: string
  country?: string
  lastCrawlAt?: string | null
  durationMs?: number
  pagesCrawled?: number
}

function fmtAgo(iso?: string | null) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDur(ms?: number) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export function CrawlHeaderCard({ scope, industry, cms, language, country, lastCrawlAt, durationMs, pagesCrawled }: Props) {
  const chips = [
    industry && { icon: <Globe size={11} />, label: industry },
    cms && { icon: <Layers size={11} />, label: cms },
    language && { icon: <Languages size={11} />, label: country ? `${language} · ${country}` : language },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>

  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">Scope</div>
          <div className="truncate text-[13px] font-medium text-neutral-200">{scope?.label || 'All pages'}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <Clock size={11} />
          <span>{fmtAgo(lastCrawlAt)}</span>
          <span className="text-neutral-600">·</span>
          <span>{fmtDur(durationMs)}</span>
          <span className="text-neutral-600">·</span>
          <span>{pagesCrawled?.toLocaleString() ?? '0'} pages</span>
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded border border-[#1f1f1f] bg-[#0f0f0f] px-1.5 py-0.5 text-[11px] text-neutral-300">
              {c.icon}
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
