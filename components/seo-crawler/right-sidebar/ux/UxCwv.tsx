import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, RingGauge, Distribution, TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function UxCwv() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Real-user core web vitals" dense>
        <div className="flex justify-around py-4">
          <RingGauge value={Math.round(s.cwv.lcpGood / s.total * 100)} size={70} label="LCP" />
          <RingGauge value={Math.round(s.cwv.inpGood / s.total * 100)} size={70} label="INP" />
          <RingGauge value={Math.round(s.cwv.clsGood / s.total * 100)} size={70} label="CLS" />
        </div>
      </Section></Card>

      <Card><Section title="LCP Buckets" dense>
        <Distribution rows={[
          { label: 'Good (<2.5s)', value: s.cwv.lcpGood, tone: 'good' },
          { label: 'Needs Impr',  value: s.total - s.cwv.lcpGood - s.cwv.lcpBad, tone: 'warn' },
          { label: 'Poor (>4s)',   value: s.cwv.lcpBad,  tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Worst LCP pages" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.lcp) > 4000)
            .sort((a, b) => Number(b.lcp) - Number(a.lcp))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${(Number(p.lcp)/1000).toFixed(1)}s`,
              onClick: () => drill.toCategory('performance', 'Core Web Vitals')
            }))}
        />
      </Section></Card>
    </div>
  )
}
