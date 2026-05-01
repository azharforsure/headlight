import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, AlertRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function UxFriction() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topRagePages = [...pages]
    .filter(p => Number(p.rageClicks) > 0)
    .sort((a, b) => Number(b.rageClicks) - Number(a.rageClicks))
    .slice(0, 5)

  const topAbandonForms = [...pages]
    .filter(p => Number(p.formAbandonCount) > 0)
    .sort((a, b) => Number(b.formAbandonCount) - Number(a.formAbandonCount))
    .slice(0, 5)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Friction KPIs" dense>
        <KpiRow>
          <KpiTile label="Rage" value={s.friction.rage} tone={s.friction.rage > 0 ? 'bad' : 'neutral'} />
          <KpiTile label="Dead" value={s.friction.dead} tone={s.friction.dead > 0 ? 'warn' : 'neutral'} />
          <KpiTile label="U-Turn" value={s.friction.uTurn} />
          <KpiTile label="Abandon" value={s.friction.formAbandon} tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top rage pages" dense>
        <TopList 
          items={topRagePages.map(p => ({
            id: p.url,
            primary: p.title || p.url,
            tail: `${p.rageClicks} rage`,
            onClick: () => drill.toPage(p)
          }))}
        />
      </Section></Card>

      <Card><Section title="Top abandon forms" dense>
        <TopList 
          items={topAbandonForms.map(p => ({
            id: p.url,
            primary: `Form on ${p.url}`,
            tail: `${p.formAbandonCount} drops`,
            onClick: () => drill.toPage(p)
          }))}
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.friction.rage > 50 && s.conv.cvr < 1 && (
          <AlertRow alert={{ id: 'rc', tone: 'bad', title: 'Critical: High rage + low CvR' }} />
        )}
        <AlertRow alert={{ id: 'dc', tone: 'warn', title: 'Dead clicks on checkout path detected' }} />
      </Section></Card>
    </div>
  )
}
