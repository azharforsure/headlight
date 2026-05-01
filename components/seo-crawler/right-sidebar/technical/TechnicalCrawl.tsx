// components/seo-crawler/right-sidebar/technical/TechnicalCrawl.tsx
import React, { useMemo } from 'react'
import { Server } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { Bar as RsBar, BarStack, MetricRow, EmptyState, fmtNum, safePct, scoreToTone } from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalCrawl() {
  const { pages, sitemapData, robotsTxt } = useSeoCrawler() as any
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Server size={20} />} />

  const sitemapTotal = Number(sitemapData?.totalUrls || 0)
  const inSitemap = s.indexability.inSitemap
  const inSitemapOnly = Math.max(0, sitemapTotal - inSitemap)

  return (
    <>
      <Card>
        <Section title="Robots & sitemaps" dense>
          <MetricRow label="robots.txt" value={robotsTxt ? 'Detected' : 'Missing'} tone={robotsTxt ? 'good' : 'warn'} />
          <MetricRow label="Sitemaps found" value={fmtNum(sitemapData?.sources?.length || 0)} tone={(sitemapData?.sources?.length || 0) > 0 ? 'good' : 'warn'} />
          <MetricRow label="URLs in sitemap" value={fmtNum(sitemapTotal)} />
          <MetricRow label="Crawled & in sitemap" value={fmtNum(inSitemap)} tone="good" />
          <MetricRow label="In sitemap only (missed)" value={fmtNum(inSitemapOnly)} tone={inSitemapOnly > 0 ? 'warn' : 'good'} />
          <MetricRow label="Indexable not in sitemap" value={fmtNum(s.indexability.missingFromSitemap)} tone={s.indexability.missingFromSitemap > 0 ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Status mix" dense>
          <BarStack segments={[
            { value: s.status.ok, tone: 'good' },
            { value: s.status.redirect, tone: 'info' },
            { value: s.status.client, tone: 'bad' },
            { value: s.status.server, tone: 'bad' },
            { value: s.status.blocked, tone: 'warn' },
          ]}/>
          <div className="grid grid-cols-2 gap-x-3 mt-2">
            <MetricRow label="2xx" value={fmtNum(s.status.ok)} tone="good" />
            <MetricRow label="3xx" value={fmtNum(s.status.redirect)} tone="info" />
            <MetricRow label="4xx" value={fmtNum(s.status.client)} tone={s.status.client ? 'bad' : 'good'} />
            <MetricRow label="5xx" value={fmtNum(s.status.server)} tone={s.status.server ? 'bad' : 'good'} />
            <MetricRow label="Blocked by robots" value={fmtNum(s.status.blocked)} tone={s.status.blocked ? 'warn' : 'good'} />
            <MetricRow label="Other / timeout" value={fmtNum(s.status.other)} tone={s.status.other ? 'warn' : 'good'} />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Crawl depth" dense>
          <RsBar tone={s.crawl.depthBuckets.d0_1 ? 'good' : 'neutral'} value={s.crawl.depthBuckets.d0_1} max={s.total} label="Depth 0–1" />
          <RsBar tone="info" value={s.crawl.depthBuckets.d2_3} max={s.total} label="Depth 2–3" />
          <RsBar tone="warn" value={s.crawl.depthBuckets.d4_5} max={s.total} label="Depth 4–5" />
          <RsBar tone="bad" value={s.crawl.depthBuckets.d6} max={s.total} label="Depth 6+" />
        </Section>
      </Card>

      <Card>
        <Section title="Redirects & hreflang" dense>
          <MetricRow label="Redirect chains > 2" value={fmtNum(s.crawl.redirectChains)} tone={s.crawl.redirectChains ? 'warn' : 'good'} />
          <MetricRow label="Redirect loops" value={fmtNum(s.crawl.redirectLoops)} tone={s.crawl.redirectLoops ? 'bad' : 'good'} />
          <MetricRow label="Orphan pages" value={fmtNum(s.indexability.orphan)} tone={s.indexability.orphan ? 'warn' : 'good'} />
          <MetricRow label="Hreflang errors" value={fmtNum(s.crawl.hreflangErrors)} tone={s.crawl.hreflangErrors ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Crawl health score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.crawl || 0)} tone={scoreToTone(s.scores.crawl)} />
          <div className="text-[10px] text-[#666] px-2">
            Composed from status mix, sitemap parity, redirect chains and orphan share.
          </div>
        </Section>
      </Card>
    </>
  )
}
