import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow,
  StatusChip, DrillChip, EmptyState,
  compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditAi() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="AI & LLM Visibility" dense>
          <KpiRow>
            <KpiTile label="llms.txt" value={s.ai.llmsTxt ? 'Yes' : 'No'} tone={s.ai.llmsTxt ? 'good' : 'warn'} />
            <KpiTile label="Blocked" value={s.ai.blockedAi} tone={s.ai.blockedAi > 0 ? 'info' : 'neutral'} />
            <KpiTile label="Citations" value={compactNum(s.ai.citations)} tone="good" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Bot Access" dense>
          <div className="flex flex-wrap gap-2 py-1">
            <StatusChip tone="good">GPTBot</StatusChip>
            <StatusChip tone="good">ClaudeBot</StatusChip>
            <StatusChip tone="warn">Google-Extended</StatusChip>
          </div>
        </Section>
      </Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Go to AI Mode" onClick={() => {}} />
      </div>
    </div>
  )
}
