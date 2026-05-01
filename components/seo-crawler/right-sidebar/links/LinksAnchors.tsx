import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, Donut, Distribution,
  TopList, AlertRow, EmptyState,
} from '../_shared'

export function LinksAnchors() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const segments = [
    { value: s.anchorMix.brand,   tone: 'info' as const, label: 'Brand' },
    { value: s.anchorMix.exact,   tone: 'bad' as const,  label: 'Exact' },
    { value: s.anchorMix.partial, tone: 'warn' as const, label: 'Partial' },
    { value: s.anchorMix.generic, tone: 'warn' as const, label: 'Generic' },
    { value: s.anchorMix.url,     tone: 'neutral' as const, label: 'URL' },
    { value: s.anchorMix.image,   tone: 'neutral' as const, label: 'Image' },
  ]

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Anchor mix" dense>
        <div className="flex justify-center py-4">
          <Donut segments={segments} size={140} thickness={12} />
        </div>
        <Distribution rows={segments.map(seg => ({
          label: seg.label,
          value: Math.round(seg.value),
          tone: seg.tone
        }))} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.anchorMix.exact > 30 && (
          <AlertRow alert={{ id: 'ex', tone: 'bad', title: 'High exact match anchor ratio (>30%)' }} />
        )}
        {s.anchorMix.generic > 25 && (
          <AlertRow alert={{ id: 'ge', tone: 'warn', title: 'High generic anchor ratio (>25%)' }} />
        )}
      </Section></Card>

      <Card><Section title="Top over-optimized pages" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.anchorExactShare) > 40)
            .sort((a, b) => Number(b.anchorExactShare) - Number(a.anchorExactShare))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${Math.round(Number(p.anchorExactShare))}% exact`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>
    </div>
  )
}
