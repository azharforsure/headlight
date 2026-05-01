// components/seo-crawler/right-sidebar/technical/TechnicalOverview.tsx
import React, { useMemo } from 'react'
import { Activity, AlertTriangle, ShieldCheck, Eye, Zap, Globe } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import {
  KpiTile as RsKpiTile, MetricRow, BarStack, RingGauge, EmptyState,
  fmtNum, fmtPct, safePct, scoreToTone,
} from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalOverview() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])

  if (!pages?.length) {
    return <EmptyState title="No crawl data yet" hint="Start a crawl to see technical health here." icon={<Activity size={20} />} />
  }

  const httpsPct = safePct(s.security.httpsPages, s.total)
  const indexablePct = safePct(s.indexability.indexable, s.html)
  const cwvPassPct = safePct(s.cwv.lcpGood + s.cwv.inpGood + s.cwv.clsGood, (s.cwv.lcpGood + s.cwv.lcpWarn + s.cwv.lcpBad) * 3 || 1)

  const alerts: Array<{ tone: 'bad' | 'warn'; label: string; n: number }> = []
  if (s.status.server > 0) alerts.push({ tone: 'bad', label: '5xx server errors', n: s.status.server })
  if (s.status.client > 0) alerts.push({ tone: 'bad', label: '4xx client errors', n: s.status.client })
  if (s.security.sslInvalid > 0) alerts.push({ tone: 'bad', label: 'Invalid SSL pages', n: s.security.sslInvalid })
  if (s.security.exposedKeys > 0) alerts.push({ tone: 'bad', label: 'Pages with exposed API keys', n: s.security.exposedKeys })
  if (s.security.mixedContent > 0) alerts.push({ tone: 'warn', label: 'Mixed-content pages', n: s.security.mixedContent })
  if (s.indexability.orphan > 0) alerts.push({ tone: 'warn', label: 'Orphan pages', n: s.indexability.orphan })
  if (s.crawl.redirectChains > 0) alerts.push({ tone: 'warn', label: 'Redirect chains > 2', n: s.crawl.redirectChains })
  alerts.sort((a, b) => b.n - a.n)

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-col items-center py-6">
          <RingGauge value={s.scores.overall} size={96} label="Health score" />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <RsKpiTile label="Pages" value={fmtNum(s.total)} sub={`${fmtNum(s.html)} HTML`} />
        <RsKpiTile label="HTTPS" value={fmtPct(httpsPct)} tone={httpsPct >= 99 ? 'good' : httpsPct >= 90 ? 'warn' : 'bad'} />
        <RsKpiTile label="Indexable" value={fmtPct(indexablePct)} tone={indexablePct >= 80 ? 'good' : indexablePct >= 60 ? 'warn' : 'bad'} />
      </div>

      <Card>
        <Section title="Status mix" dense>
          <BarStack
            segments={[
              { value: s.status.ok, tone: 'good', label: '2xx' },
              { value: s.status.redirect, tone: 'info', label: '3xx' },
              { value: s.status.client, tone: 'bad', label: '4xx' },
              { value: s.status.server, tone: 'bad', label: '5xx' },
              { value: s.status.blocked, tone: 'warn', label: 'Blocked' },
            ]}
          />
          <div className="grid grid-cols-2 gap-x-3 mt-2">
            <MetricRow label="2xx OK" value={fmtNum(s.status.ok)} tone={scoreToTone(safePct(s.status.ok, s.total))} />
            <MetricRow label="3xx Redirects" value={fmtNum(s.status.redirect)} tone="info" />
            <MetricRow label="4xx Client" value={fmtNum(s.status.client)} tone={s.status.client ? 'bad' : 'good'} />
            <MetricRow label="5xx Server" value={fmtNum(s.status.server)} tone={s.status.server ? 'bad' : 'good'} />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Sub-score breakdown" dense>
          {(['crawl', 'index', 'render', 'perf', 'security', 'a11y'] as const).map((k) => {
            const v = s.scores[k]
            return <MetricRow key={k}
              label={k === 'a11y' ? 'Accessibility' : k === 'perf' ? 'Performance' : k.charAt(0).toUpperCase() + k.slice(1)}
              value={Number.isFinite(v) ? Math.round(v) : '—'}
              tone={scoreToTone(v)}
            />
          })}
        </Section>
      </Card>

      <Card>
        <Section title="Top alerts" dense>
          {alerts.length === 0 ? (
            <div className="text-[11px] text-[#666] px-2 py-1.5">No critical issues detected.</div>
          ) : (
            alerts.slice(0, 6).map((a, i) => (
              <MetricRow key={i} label={
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle size={11} className={a.tone === 'bad' ? 'text-[#ef4444]' : 'text-[#f59e0b]'} />
                  {a.label}
                </span>
              } value={fmtNum(a.n)} tone={a.tone} />
            ))
          )}
        </Section>
      </Card>

      <Card>
        <Section title="Quick signals" dense>
          <MetricRow label={<span className="inline-flex items-center gap-1.5"><Eye size={11}/>Indexable HTML</span>} value={`${fmtNum(s.indexability.indexable)} / ${fmtNum(s.html)}`} tone={scoreToTone(indexablePct)} />
          <MetricRow label={<span className="inline-flex items-center gap-1.5"><Globe size={11}/>HTTPS coverage</span>} value={fmtPct(httpsPct)} tone={scoreToTone(httpsPct)} />
          <MetricRow label={<span className="inline-flex items-center gap-1.5"><Zap size={11}/>CWV passing</span>} value={fmtPct(cwvPassPct)} tone={scoreToTone(cwvPassPct)} />
          <MetricRow label={<span className="inline-flex items-center gap-1.5"><ShieldCheck size={11}/>Security score</span>} value={Math.round(s.scores.security || 0)} tone={scoreToTone(s.scores.security)} />
        </Section>
      </Card>
    </div>
  )
}
