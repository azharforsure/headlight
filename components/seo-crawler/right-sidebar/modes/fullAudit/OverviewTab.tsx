import React from 'react'
import {
  Card, Chip, Gauge, MiniRadar, Row, ActionsList, SourceChip, FreshnessChip,
  StatTile, KpiTile, Sparkline, RsPartial, SectionTitle,
} from '@/components/seo-crawler/right-sidebar/shared'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { FullAuditStats } from '@/services/right-sidebar/fullAudit.types'

const SRC_CRAWL = { tier: 'scrape',        name: 'Crawler' } as const
const SRC_HEUR  = { tier: 'est',           name: 'Heuristic' } as const
const SRC_GSC   = { tier: 'authoritative', name: 'Search Console' } as const

const fmtInt = (n: number) => n.toLocaleString()
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

export function FullOverviewTab({ stats }: RsTabProps<FullAuditStats>) {
  const { setAuditFilter, auditFilter } = useSeoCrawler()
  const fp = stats.fingerprint

  return (
    <div className="flex flex-col gap-3">
      {/* Site fingerprint */}
      <Card title="Site fingerprint" right={<SourceChip source={SRC_CRAWL} />}>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Row label="Domain"   value={fp.domain || '—'} />
          <Row label="Pages"    value={fmtInt(fp.pageCount)} />
          <Row label="CMS"      value={fp.cms ?? '—'} />
          <Row label="Language" value={fp.language ?? '—'} />
          <Row label="Industry" value={fp.industry ?? '—'} />
          <Row label="JS"       value={fp.jsFramework ?? '—'} />
        </div>
        {fp.isMultiLanguage && <div className="mt-2"><Chip tone="info">Multi-language</Chip></div>}
      </Card>

      {/* Hero score */}
      <Card title="Site health" right={<SourceChip source={SRC_HEUR} />}>
        <div className="flex items-center gap-3">
          <Gauge value={stats.overallScore} label="score" />
          <div className="flex-1 flex flex-wrap gap-1">
            {stats.heroChips.map(c => <Chip key={c.label} tone={c.tone}>{c.label}: {c.value}</Chip>)}
          </div>
        </div>
      </Card>

      {/* Coverage radar */}
      <Card title="Coverage radar" right={<SourceChip source={SRC_HEUR} />}>
        <div className="flex items-center justify-center"><MiniRadar axes={stats.radar} /></div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {stats.radar.map(r => <Row key={r.axis} label={r.axis} value={`${r.value}`} />)}
        </div>
      </Card>

      {/* Search performance */}
      {stats.search?.connected ? (
        <Card title="Search performance (30d)" right={<SourceChip source={SRC_GSC} />}>
          <div className="grid grid-cols-2 gap-1.5">
            <StatTile label="Clicks"      value={fmtInt(stats.search.totalClicks)} />
            <StatTile label="Impressions" value={fmtInt(stats.search.totalImpressions)} />
            <StatTile label="Avg CTR"     value={fmtPct(stats.search.avgCtr)} />
            <StatTile label="Avg Pos."    value={stats.search.avgPosition?.toFixed(1) ?? '—'} />
          </div>
          {stats.search.clicksTrend.length > 1 && (
            <div className="mt-2"><Sparkline data={stats.search.clicksTrend} width={240} height={36} /></div>
          )}
        </Card>
      ) : (
        <RsPartial title="Connect Search Console" reason="Clicks, impressions, CTR and position need GSC." />
      )}

      {/* Risk signals */}
      <SectionTitle>Risk signals</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        <StatTile label="Losing traffic" value={fmtInt(stats.risk.losingTraffic)}
          tone={stats.risk.losingTraffic > 0 ? 'warn' : 'good'}
          onClick={() => setAuditFilter({ ...auditFilter, trafficStatus: 'declining' })} />
        <StatTile label="Broken (4xx/5xx)" value={fmtInt(stats.risk.broken)}
          tone={stats.risk.broken > 0 ? 'bad' : 'good'}
          onClick={() => setAuditFilter({ ...auditFilter, statusBucket: ['4xx','5xx'] })} />
        <StatTile label="Orphans" value={fmtInt(stats.risk.orphans)}
          tone={stats.risk.orphans > 0 ? 'warn' : 'good'}
          onClick={() => setAuditFilter({ ...auditFilter, orphans: true })} />
        <StatTile label="Redirect chains" value={fmtInt(stats.risk.redirectChains)}
          tone={stats.risk.redirectChains > 0 ? 'warn' : 'good'}
          onClick={() => setAuditFilter({ ...auditFilter, statusBucket: ['3xx'] })} />
        <StatTile label="Duplicate titles" value={fmtInt(stats.risk.duplicateTitles)}
          tone={stats.risk.duplicateTitles > 0 ? 'warn' : 'good'}
          onClick={() => setAuditFilter({ ...auditFilter, dupTitles: true })} />
        <StatTile label="Position dropped" value={fmtInt(stats.risk.declining)}
          tone={stats.risk.declining > 0 ? 'warn' : 'good'} />
      </div>

      {/* Top quick fixes */}
      <Card title="Top quick fixes" right={<SourceChip source={SRC_CRAWL} />}>
        <ActionsList actions={stats.actions.slice(0, 3)} />
      </Card>
    </div>
  )
}
