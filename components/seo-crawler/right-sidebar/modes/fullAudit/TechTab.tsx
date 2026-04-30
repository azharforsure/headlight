import React from 'react'
import {
  Card, Row, MiniBar, StackedBar, SourceChip, FreshnessChip, fmtTime,
  Donut, Bar, StatTile, RsPartial, SectionTitle,
} from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { FullAuditStats } from '@/services/right-sidebar/fullAudit.types'

const SRC_CRAWL = { tier: 'scrape',        name: 'Crawler' } as const
const SRC_PSI   = { tier: 'free-api',      name: 'PSI/CrUX' } as const

export function FullTechTab({ stats }: RsTabProps<FullAuditStats>) {
  const t = stats.tech
  const segments = t.statusMix.map(s => ({ value: s.count, color: s.color, label: s.code }))

  return (
    <div className="flex flex-col gap-3">
      <Card title="Health" right={<SourceChip source={SRC_CRAWL} />}>
        <Row label="HTTPS"           value={`${t.httpsPct}%`}            tone={t.httpsPct >= 95 ? 'good' : 'bad'} />
        <Row label="Indexable"       value={`${t.indexablePct}%`}        tone={t.indexablePct >= 80 ? 'good' : 'warn'} />
        <Row label="Broken pages"    value={t.brokenPages}               tone={t.brokenPages === 0 ? 'good' : 'bad'} />
        <Row label="Schema coverage" value={`${t.schemaCoveragePct}%`}   tone={t.schemaCoveragePct >= 60 ? 'good' : 'warn'} />
        <Row label="Avg response"    value={fmtTime(t.avgResponseMs ?? null)} tone={(t.avgResponseMs ?? 0) < 800 ? 'good' : 'warn'} />
      </Card>

      <Card title="Status mix" right={<SourceChip source={SRC_CRAWL} />}>
        <StackedBar segments={segments} height={10} />
        <div className="mt-2 grid grid-cols-2 gap-1">
          {t.statusMix.map(s => (
            <Row key={s.code} label={s.code} value={s.count.toLocaleString()} />
          ))}
        </div>
      </Card>

      <Card title="Indexability" right={<SourceChip source={SRC_CRAWL} />}>
        <div className="flex items-center gap-3">
          <Donut segments={[
            { label: 'Indexable',     value: t.indexablePct,    color: '#34d399' },
            { label: 'Non-indexable', value: t.nonIndexablePct, color: '#fbbf24' },
          ]} />
          <div className="flex-1 grid grid-cols-1 gap-1">
            <Row label="Indexable"     value={`${t.indexablePct}%`}    tone="good" />
            <Row label="Non-indexable" value={`${t.nonIndexablePct}%`} tone="warn" />
          </div>
        </div>
      </Card>

      <Card title="Crawl meta" right={<SourceChip source={SRC_CRAWL} />}>
        <Row label="Sitemap coverage" value={`${t.sitemapCoveragePct}%`} tone={t.sitemapCoveragePct >= 90 ? 'good' : 'warn'} />
        <Row label="robots.txt"        value={t.robotsPresent ? 'Present' : 'Missing'} tone={t.robotsPresent ? 'good' : 'bad'} />
        <Row label="Avg crawl depth"   value={t.avgCrawlDepth} tone={t.avgCrawlDepth <= 3 ? 'good' : 'warn'} />
        <div className="mt-2">
          <SectionTitle>Depth distribution</SectionTitle>
          <Bar data={t.depthHistogram} />
        </div>
      </Card>

      {t.cwv.connected ? (
        <Card title="Core Web Vitals" right={<SourceChip source={SRC_PSI} />}>
          <div className="grid grid-cols-2 gap-1.5">
            <StatTile label="LCP" value={t.cwv.lcpMs != null ? `${t.cwv.lcpMs}ms` : '—'}
              tone={(t.cwv.lcpMs ?? 0) <= 2500 ? 'good' : (t.cwv.lcpMs ?? 0) <= 4000 ? 'warn' : 'bad'} />
            <StatTile label="CLS" value={t.cwv.cls != null ? t.cwv.cls.toFixed(2) : '—'}
              tone={(t.cwv.cls ?? 0) <= 0.1 ? 'good' : (t.cwv.cls ?? 0) <= 0.25 ? 'warn' : 'bad'} />
            <StatTile label="INP" value={t.cwv.inpMs != null ? `${t.cwv.inpMs}ms` : '—'}
              tone={(t.cwv.inpMs ?? 0) <= 200 ? 'good' : (t.cwv.inpMs ?? 0) <= 500 ? 'warn' : 'bad'} />
            <StatTile label="Pass rate" value={t.cwv.passRatePct != null ? `${t.cwv.passRatePct}%` : '—'}
              tone={(t.cwv.passRatePct ?? 0) >= 75 ? 'good' : 'warn'} />
          </div>
        </Card>
      ) : (
        <RsPartial title="Connect PSI / CrUX" reason="Core Web Vitals require PageSpeed Insights or CrUX." />
      )}
    </div>
  )
}
