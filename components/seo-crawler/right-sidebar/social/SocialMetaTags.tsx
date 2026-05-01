import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function SocialMetaTags() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="OG coverage" dense>
        <KpiRow>
          <KpiTile label="Valid OG"   value={s.og.ok} tone="good" />
          <KpiTile label="Missing Img" value={s.og.noImage} tone="bad" />
          <KpiTile label="No Card"    value={s.og.noCard} tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Tag distribution" dense>
        <Distribution rows={[
          { label: 'Full OG', value: s.og.ok, tone: 'good' },
          { label: 'Missing', value: s.og.missing, tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Pages missing tags" dense>
        <TopList 
          items={pages
            .filter(p => p.isHtmlPage && (!p.ogImage || !p.twitterCard))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: 'Fix',
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'meta-1',
            title: 'Auto-generate OG images',
            reason: `${s.og.noImage} pages are missing shareable images`,
            affected: s.og.noImage,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
