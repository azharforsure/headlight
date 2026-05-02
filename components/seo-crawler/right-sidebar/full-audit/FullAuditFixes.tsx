import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, DistRowsBlock, IssueAreaGridBlock,
  WhatBlocksScoreCard, QuadrantBlock, RecommendedActionsBlock,
  OwnerLoadBlock, TrendBlock, ImpactForecastCard,
  DrillFooter, EmptyState, compactNum,
} from '../_shared'

export function FullAuditFixes() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const severityRows = useMemo(() => ([
    { label: 'Critical', value: s.issues.errors5xx, tone: 'bad' as const },
    { label: 'High',     value: s.issues.errors4xx + s.issues.notIndexable + s.tech.sslInvalid, tone: 'bad' as const },
    { label: 'Medium',   value: s.perf.lcpFail + s.perf.inpFail + s.tech.redirectChains, tone: 'warn' as const },
    { label: 'Low',      value: s.issues.missingMeta + s.issues.missingAlt + s.tech.cspMissing, tone: 'info' as const },
  ]), [s])

  const tiles = useMemo(() => ([
    { id: 'tech',    label: 'Tech',         count: s.issues.errors4xx + s.issues.errors5xx + s.tech.redirectChains,                tone: 'bad'  as const, hint: '4xx · 5xx · chains',            onClick: () => drill.toCategory('codes', 'All') },
    { id: 'idx',     label: 'Indexability', count: s.issues.notIndexable + s.issues.canonicalMismatch,                              tone: 'warn' as const, hint: 'noindex · canonical',          onClick: () => drill.toCategory('indexability', 'Non-Indexable') },
    { id: 'perf',    label: 'Performance',  count: s.perf.lcpFail + s.perf.inpFail + s.perf.clsFail,                                tone: 'warn' as const, hint: 'LCP · INP · CLS',              onClick: () => drill.toCategory('performance', 'Poor LCP') },
    { id: 'sec',     label: 'Security',     count: s.tech.hstsMissing + s.tech.cspMissing + s.tech.sslInvalid + s.tech.mixedContent,tone: 'warn' as const, hint: 'HSTS · CSP · TLS' },
    { id: 'cnt',     label: 'Content',      count: s.content.thinPages + s.content.duplicates + s.issues.missingTitle + s.issues.missingMeta, tone: 'info' as const, hint: 'thin · dup · meta' },
    { id: 'lnk',     label: 'Links',        count: s.issues.broken + s.issues.orphans,                                              tone: 'info' as const, hint: 'broken · orphans',             onClick: () => drill.toCategory('links', 'Orphan Pages') },
    { id: 'schema',  label: 'Schema',       count: (s.tech.schemaCoverage || []).reduce((a: number, r: any) => a + (100 - r.coverage), 0) > 0 ? Math.max(0, Math.round((100 - ((s.ai?.schemaCoverage ?? 0))) / 5)) : 0, tone: 'info' as const, hint: 'rich-result gaps' },
    { id: 'a11y',    label: 'A11y',         count: s.tech.a11y?.issues ?? 0,                                                        tone: 'info' as const, hint: 'WCAG 2.2 AA' },
  ]), [s, drill])

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Issue volume" dense>
          <KpiRow>
            <KpiTile label="Errors"     value={compactNum(s.issues.errors)}   tone={s.issues.errors > 0 ? 'bad' : 'neutral'} />
            <KpiTile label="Warnings"   value={compactNum(s.issues.warnings)} tone={s.issues.warnings > 0 ? 'warn' : 'neutral'} />
            <KpiTile label="Notices"    value={compactNum(s.issues.notices)}  tone="info" />
            <KpiTile label="Open fixes" value={compactNum(s.recommendations.length)} />
          </KpiRow>
        </Section>
      </Card>

      <DistRowsBlock title="Severity" rows={severityRows} />

      <IssueAreaGridBlock tiles={tiles} />

      <WhatBlocksScoreCard deductions={s.deductions.items} totalLost={s.deductions.totalLost} />

      <QuadrantBlock
        title="Effort vs impact"
        items={s.actions.effortImpact}
        onCellClick={(c) => drill.toCategory('action', `impact:${c.impact}|effort:${c.effort}`)}
      />

      <RecommendedActionsBlock
        title="Recommended actions"
        items={s.recommendations.slice(0, 8).map(r => ({ ...r, onClick: () => drill.toCategory('action', r.id) }))}
        onSeeAll={() => drill.toCategory('action', 'All')}
        seeAllLabel={`See all ${s.recommendations.length}`}
      />

      <OwnerLoadBlock
        rows={s.actions.ownerLoad}
        onClick={(id) => drill.toCategory('owner', id)}
      />

      {s.hasPrior && (
        <TrendBlock title="Fixes shipped (6 weeks)" values={s.actions.doneSeries} tone="good" />
      )}

      <ImpactForecastCard
        deltaScore={s.actions.forecast.deltaScore}
        deltaClicks={s.actions.forecast.deltaClicks}
        horizonDays={s.actions.forecast.horizonDays}
        confidence={s.actions.forecast.confidence}
      />

      <DrillFooter chips={[
        { label: '4xx',     count: s.issues.errors4xx,    onClick: () => drill.toCategory('codes', '404 Not Found') },
        { label: '5xx',     count: s.issues.errors5xx,    onClick: () => drill.toCategory('codes', '500 Server Error') },
        { label: 'Noindex', count: s.issues.notIndexable, onClick: () => drill.toCategory('indexability', 'Non-Indexable') },
        { label: 'Orphans', count: s.issues.orphans,      onClick: () => drill.toCategory('links', 'Orphan Pages') },
      ]} />
    </div>
  )
}
