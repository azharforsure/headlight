import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import {
  Card, Section, KpiRow, KpiTile, MetricRow, AlertRow, DrillChip, EmptyState, fmtNum, compactNum, scoreToTone,
} from '../_shared'

export function SocialOverview() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Brand snapshot" dense>
        <KpiRow>
          <KpiTile label="Followers" value={compactNum(s.followers)} />
          <KpiTile label="Mentions"  value={fmtNum(s.mentions.length)} />
          <KpiTile label="Sentiment" value={s.sentiment.avg.toFixed(1)} tone={scoreToTone(s.sentiment.avg * 100)} />
        </KpiRow>
      </Section></Card>

      <div className="grid grid-cols-2 gap-2">
        {s.profiles.map((p: any) => (
          <Card key={p.platform} className="p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#ccc] uppercase">{p.platform}</span>
              <span className="text-[9px] text-green-500">+{p.growth30d}</span>
            </div>
            <div className="mt-1 text-[13px] font-mono">{compactNum(p.followers)}</div>
          </Card>
        ))}
      </div>

      <Card><Section title="Alerts" dense>
        {s.og.missing > 0 && (
          <AlertRow alert={{ id: 'og', tone: 'warn', title: 'OG tags missing on pages', count: s.og.missing }} />
        )}
        {s.sentiment.neg > 5 && (
          <AlertRow alert={{ id: 'neg', tone: 'bad', title: 'Negative sentiment spike detected' }} />
        )}
        {s.profiles.some((p: any) => p.lastPostDays > 14) && (
          <AlertRow alert={{ id: 'in', tone: 'warn', title: 'Inactive social profiles (>14d)' }} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Mentions" count={s.mentions.length} />
        <DrillChip label="Engagement" />
        <DrillChip label="Traffic" />
      </div>
    </div>
  )
}

