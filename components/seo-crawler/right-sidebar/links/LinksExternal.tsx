import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile,
  TopList, AlertRow, EmptyState, fmtNum,
} from '../_shared'

export function LinksExternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const externalDomains = pages.reduce((acc, p) => {
    const list = Array.isArray(p.externalOutlinkDomains) ? p.externalOutlinkDomains : []
    list.forEach((d: string) => acc.add(d))
    return acc
  }, new Set<string>()).size

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Outbound summary" dense>
        <KpiRow>
          <KpiTile label="Ext outlinks" value={fmtNum(s.externalTotal)} />
          <KpiTile label="Ext domains"   value={fmtNum(externalDomains)} />
          <KpiTile label="Broken ext"    value={fmtNum(s.internal.brokenOut)} tone={s.internal.brokenOut > 0 ? 'bad' : 'neutral'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top external domains" dense>
        <TopList 
          items={[]} // Logic for top domains aggregation would be here if available in page data
          placeholder="No external domain data aggregated."
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        <AlertRow alert={{ id: 'i', tone: 'warn', title: 'Insecure outbound links (HTTP)' }} />
        <AlertRow alert={{ id: 'n', tone: 'info', title: 'Nofollow outbound rate: 12%' }} />
      </Section></Card>
    </div>
  )
}
