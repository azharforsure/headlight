import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, Distribution, TopList, EmptyState,
} from '../_shared'

export function UxFunnels() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()

  // Mock funnel data as it's often configuration-based
  const funnels = [
    {
      name: 'Checkout Funnel',
      steps: [
        { label: 'Visit',    value: 1200, tone: 'info' as const },
        { label: 'Product',  value: 800,  tone: 'info' as const },
        { label: 'Cart',     value: 200,  tone: 'warn' as const },
        { label: 'Success',  value: 45,   tone: 'good' as const },
      ]
    }
  ]

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  if (funnels.length === 0) {
    return <EmptyState title="No funnels configured" hint="Setup conversion funnels in settings." />
  }

  return (
    <div className="space-y-3 p-3">
      {funnels.map((f, i) => (
        <Card key={i}><Section title={f.name} dense>
          <Distribution rows={f.steps} />
        </Section></Card>
      ))}

      <Card><Section title="Top step drops" dense>
        <TopList 
          items={[
            { id: '1', primary: 'Cart → Success', tail: '78% drop', tone: 'bad' },
            { id: '2', primary: 'Product → Cart', tail: '75% drop', tone: 'warn' },
          ]}
        />
      </Section></Card>
    </div>
  )
}
