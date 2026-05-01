import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function PaidLandingPages() {
  const { paidCampaigns, pages } = useSeoCrawler() as any
  const s = usePaidInsights()
  const drill = useDrill()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Landing page health" dense>
        <KpiRow>
          <KpiTile label="Total LPs" value={s.lps.length} />
          <KpiTile label="Slow LPs"  value={s.lpAlerts.slow} tone={s.lpAlerts.slow > 0 ? 'bad' : 'neutral'} />
          <KpiTile label="Mismatch"  value={s.lpAlerts.missMatch} tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top QS-LP Drag" dense>
        <TopList 
          items={s.lps
            .filter((p: any) => Number(p.lcp) > 2500 || Number(p.adIntentMatchScore) < 0.7)
            .sort((a: any, b: any) => Number(b.lcp) - Number(a.lcp))
            .slice(0, 5)
            .map((p: any) => ({
              id: p.url,
              primary: p.title || p.url,
              secondary: `Intent Match: ${Math.round(p.adIntentMatchScore * 100)}%`,
              tail: `${(p.lcp/1000).toFixed(1)}s`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'lp-1',
            title: 'Fix message mismatch',
            reason: `2 LPs have low ad-intent match scores (<60%)`,
            affected: 2,
            primary: true
          }}
        />
        <ActionRow 
          action={{
            id: 'lp-2',
            title: 'Improve LP performance',
            reason: `${s.lpAlerts.slow} paid landing pages fail LCP`,
            affected: s.lpAlerts.slow
          }}
        />
      </Section>
    </div>
  )
}
