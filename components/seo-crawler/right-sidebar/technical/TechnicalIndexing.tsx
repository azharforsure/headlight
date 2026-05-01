// components/seo-crawler/right-sidebar/technical/TechnicalIndexing.tsx
import React, { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { Bar as RsBar, MetricRow, EmptyState, fmtNum, safePct, scoreToTone } from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalIndexing() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Eye size={20} />} />

  const indexablePct = safePct(s.indexability.indexable, s.html)

  return (
    <>
      <Card>
        <Section title="Indexability" dense>
          <RsBar tone="good" value={s.indexability.indexable} max={s.html} label="Indexable HTML" />
          <RsBar tone="warn" value={s.indexability.noindex} max={s.html} label="Noindex" />
          <RsBar tone="bad" value={s.indexability.blockedRobots} max={s.html} label="Blocked by robots" />
          <RsBar tone="warn" value={s.indexability.canonicalDifferent} max={s.html} label="Canonical to other URL" />
          <div className="mt-2"><MetricRow label="Indexable share" value={`${indexablePct.toFixed(1)}%`} tone={scoreToTone(indexablePct)} /></div>
        </Section>
      </Card>

      <Card>
        <Section title="Canonical tags" dense>
          <MetricRow label="Self-canonical" value={fmtNum(s.indexability.canonicalSelf)} tone="good" />
          <MetricRow label="Different canonical" value={fmtNum(s.indexability.canonicalDifferent)} tone={s.indexability.canonicalDifferent ? 'info' : 'good'} />
          <MetricRow label="Missing canonical" value={fmtNum(s.indexability.canonicalMissing)} tone={s.indexability.canonicalMissing ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Sitemap parity" dense>
          <MetricRow label="In sitemap & crawled" value={fmtNum(s.indexability.inSitemap)} tone="good" />
          <MetricRow label="Indexable, not in sitemap" value={fmtNum(s.indexability.missingFromSitemap)} tone={s.indexability.missingFromSitemap ? 'warn' : 'good'} />
          <MetricRow label="Orphan pages" value={fmtNum(s.indexability.orphan)} tone={s.indexability.orphan ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Indexing score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.index || 0)} tone={scoreToTone(s.scores.index)} />
          <div className="text-[10px] text-[#666] px-2">
            Indexable share, canonical coverage, and noindex penalty.
          </div>
        </Section>
      </Card>
    </>
  )
}
