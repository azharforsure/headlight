import React, { useMemo } from 'react'
import { Card, ActionsList, SourceChip, SectionTitle, Chip } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { FullAuditStats } from '@/services/right-sidebar/fullAudit.types'

const SRC = { tier: 'scrape', name: 'Crawler' } as const
const EFFORT_TONE = { low: 'good', medium: 'warn', high: 'bad' } as const

export function FullActionsTab({ stats }: RsTabProps<FullAuditStats>) {
  const groups = useMemo(() => {
    const by: Record<'low'|'medium'|'high', FullAuditStats['actions']> = { low: [], medium: [], high: [] }
    for (const a of stats.actions) by[a.effort].push(a)
    return by
  }, [stats.actions])

  const totalImpact = stats.actions.reduce((s, a) => s + a.impact, 0)

  return (
    <div className="flex flex-col gap-3">
      <Card title="Forecast" right={<SourceChip source={SRC} />}>
        <div className="flex items-center gap-2">
          <Chip tone="info">{stats.actions.length} actions</Chip>
          <Chip tone="neutral">+{totalImpact.toLocaleString()} impact units</Chip>
        </div>
      </Card>

      {(['low','medium','high'] as const).map(effort => groups[effort].length > 0 && (
        <Card key={effort}
          title={<span className="flex items-center gap-2">
            <span>{effort === 'low' ? 'Quick wins' : effort === 'medium' ? 'Medium lift' : 'Heavy lift'}</span>
            <Chip tone={EFFORT_TONE[effort]}>{groups[effort].length}</Chip>
          </span>}
          right={<SourceChip source={SRC} />}>
          <ActionsList actions={groups[effort]} max={20} />
        </Card>
      ))}
    </div>
  )
}
