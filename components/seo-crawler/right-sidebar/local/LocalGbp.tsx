import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'

export function LocalGbp() {
  const s = useLocalInsights()

  if (!s.gbpProfiles.length) return <EmptyState title="No GBP profiles linked" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="GBP Status" dense>
        <KpiRow>
          <KpiTile label="Verified"   value={s.gbp.verified} tone="good" />
          <KpiTile label="Unverified" value={s.gbp.unverified} tone="warn" />
          <KpiTile label="Duplicates" value={s.gbp.duplicates} tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Completeness" dense>
        <Distribution rows={[
          { label: '100%', value: s.gbpProfiles.filter((g: any) => g.completeness === 1).length, tone: 'good' },
          { label: '>80%', value: s.gbpProfiles.filter((g: any) => g.completeness >= 0.8 && g.completeness < 1).length, tone: 'info' },
          { label: '<80%', value: s.gbpProfiles.filter((g: any) => g.completeness < 0.8).length, tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="Unverified profiles" dense>
        <TopList 
          items={s.gbpProfiles
            .filter((g: any) => !g.verified)
            .slice(0, 5)
            .map((g: any) => ({
              id: g.id,
              primary: g.name,
              tail: 'Verify',
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'gbp-1',
            title: 'Verify GBP profiles',
            reason: `${s.gbp.unverified} business profiles are currently unverified`,
            affected: s.gbp.unverified,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
