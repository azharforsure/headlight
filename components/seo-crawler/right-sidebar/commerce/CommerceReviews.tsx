import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState, fmtNum, compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CommerceReviews() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()

  if (!pages?.length || s.total === 0) return <EmptyState title="No product data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Review summary" dense>
        <KpiRow>
          <KpiTile label="Total reviews" value={fmtNum(s.reviews.total)} />
          <KpiTile label="Avg rating"    value={s.reviews.avg.toFixed(1) + ' ★'} tone={s.reviews.avg > 4.5 ? 'good' : 'warn'} />
          <KpiTile label="No reviews"    value={s.reviews.noReviews} tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Rating distribution" dense>
        <Distribution rows={[
          { label: '5 Star', value: 75, tone: 'good' },
          { label: '4 Star', value: 15, tone: 'good' },
          { label: '3 Star', value: 5,  tone: 'neutral' },
          { label: '2 Star', value: 3,  tone: 'warn' },
          { label: '1 Star', value: 2,  tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Products needing reviews" dense>
        <TopList 
          items={s.products
            .filter(p => Number(p.reviewCount || 0) === 0)
            .sort((a, b) => Number(b.ga4Views || 0) - Number(a.ga4Views || 0))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${compactNum(Number(p.ga4Views || 0))} views`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'rev-1',
            title: 'Solicit reviews for high-traffic products',
            reason: `${s.reviews.noReviews} products have zero reviews despite high traffic`,
            forecast: 'Improve CvR & CTR',
            primary: true
          }}
        />
      </Section>
    </div>
  )
}

