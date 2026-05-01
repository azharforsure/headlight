import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, MetricRow, BarStack, Distribution,
  TopList, AlertRow, ActionRow, DrillChip, EmptyState,
  fmtNum, fmtMs, fmtPct, scoreToTone,
} from '../_shared'

export function TechnicalCrawl() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const slowestRedirects = (pages || [])
    .filter(p => Number(p.redirectChainLength) > 1)
    .sort((a, b) => Number(b.redirectChainLength) - Number(a.redirectChainLength))
    .slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Crawl summary" dense>
        <KpiRow>
          <KpiTile label="Discovered" value={fmtNum(s.total)} />
          <KpiTile label="HTML pages" value={fmtNum(s.html)} />
          <KpiTile label="Blocked"    value={fmtNum(s.status.blocked)} tone={s.status.blocked ? 'warn' : 'neutral'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Status mix" dense>
        <BarStack segments={[
          { value: s.status.ok,       tone: 'good', label: '2xx' },
          { value: s.status.redirect, tone: 'info', label: '3xx' },
          { value: s.status.client,   tone: 'bad',  label: '4xx' },
          { value: s.status.server,   tone: 'bad',  label: '5xx' },
          { value: s.status.blocked,  tone: 'warn', label: 'blocked' },
        ]} />
      </Section></Card>

      <Card><Section title="Depth distribution" dense>
        <Distribution rows={[
          { label: '0–1', value: pages.filter(p => Number(p.crawlDepth) <= 1).length },
          { label: '2–3', value: pages.filter(p => { const d = Number(p.crawlDepth); return d >= 2 && d <= 3 }).length },
          { label: '4–5', value: pages.filter(p => { const d = Number(p.crawlDepth); return d >= 4 && d <= 5 }).length },
          { label: '6+',  value: pages.filter(p => Number(p.crawlDepth) >= 6).length, tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="Redirect chains" dense>
        <TopList items={slowestRedirects.map(p => ({
          id: p.url,
          primary: p.title || p.url,
          secondary: p.url,
          tail: `${p.redirectChainLength} hops`,
          onClick: () => drill.toPage(p),
        }))} max={6} onSeeAll={() => drill.toCategory('links', 'Redirect Chains')} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.crawl.redirectChains > 0 && (
          <AlertRow alert={{ id: 'r', tone: 'warn', title: 'Redirect chains > 1', count: s.crawl.redirectChains }} 
                    onClick={() => drill.toIssue('canonical_chain')} />
        )}
        {s.crawl.depthOver5 > 0 && (
          <AlertRow alert={{ id: 'd', tone: 'warn', title: 'Pages deeper than 5', count: s.crawl.depthOver5 }} 
                    onClick={() => drill.toCategory('architecture', 'Depth 6+')} />
        )}
        {s.indexability.orphan > 0 && (
          <AlertRow alert={{ id: 'o', tone: 'warn', title: 'Orphan pages', count: s.indexability.orphan }} 
                    onClick={() => drill.toCategory('indexability', 'Orphan Pages')} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Indexing"  count={s.indexability.noindex + s.indexability.blocked} />
        <DrillChip label="Render"    />
        <DrillChip label="Sitemap"   onClick={() => drill.toCategory('codes', 'All')} />
      </div>
    </div>
  )
}
