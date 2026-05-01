import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile,
  TopList, AlertRow, ActionRow, EmptyState, fmtNum,
} from '../_shared'

export function LinksToxic() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Toxicity overview" dense>
        <KpiRow>
          <KpiTile label="Toxic pages" value={s.toxic.domains} tone={s.toxic.domains > 0 ? 'bad' : 'neutral'} />
          <KpiTile label="Total links" value={fmtNum(s.toxic.total)} tone={s.toxic.total > 0 ? 'bad' : 'neutral'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top toxic referrers" dense>
        <TopList 
          items={s.topReferrers.map(([url, count]) => ({
            id: url,
            primary: url,
            tail: fmtNum(count),
          }))}
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        <AlertRow alert={{ id: 's', tone: 'bad', title: 'Spike in toxic links detected (30d)' }} />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'd',
            title: 'Generate Disavow Draft',
            reason: 'Protect domain authority from low-quality referrers',
            affected: s.toxic.domains,
            primary: true
          }}
          onApprove={() => {}}
        />
      </Section>
    </div>
  )
}
