import {
  Card, SectionTitle, Row, MiniBar, SourceChip, fmtNum,
} from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

const TYPE_LABEL: Record<string, string> = {
  content: 'Content', tech: 'Tech', links: 'Links',
  merge: 'Merge', deprecate: 'Deprecate',
}

export function WqaActionsTab({ stats }: RsTabProps<WqaStats>) {
  const { actions, actionPriorityCounts, actionTypeCounts, ownerLoad, forecast } = stats
  const topTemplates = [...actions]
    .sort((a, b) => b.pagesAffected - a.pagesAffected)
    .slice(0, 7)

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle>By priority</SectionTitle>
        <Row label="● High"   value={fmtNum(actionPriorityCounts.high)}   tone="bad" />
        <Row label="● Medium" value={fmtNum(actionPriorityCounts.medium)} tone="warn" />
        <Row label="● Low"    value={fmtNum(actionPriorityCounts.low)}    tone="muted" />
        <SourceChip sources={['Rules']} />
      </Card>

      <Card>
        <SectionTitle>By type</SectionTitle>
        <MiniBar
          data={Object.entries(actionTypeCounts).map(([k, v]) => ({
            label: TYPE_LABEL[k] || k, value: v,
          }))}
          height={56}
        />
        <SourceChip sources={['Rules']} />
      </Card>

      <Card>
        <SectionTitle>Top action templates</SectionTitle>
        {topTemplates.map(a => (
          <Row
            key={a.id}
            label={a.label}
            value={fmtNum(a.pagesAffected)}
            tone={a.priority === 'high' ? 'bad' : a.priority === 'medium' ? 'warn' : 'muted'}
          />
        ))}
        <SourceChip sources={['Rules']} />
      </Card>

      {forecast && (
        <Card accent="violet">
          <SectionTitle>Impact forecast</SectionTitle>
          <Row label="Q-avg uplift"     value={`▲${forecast.qDelta}`} tone="good" />
          <Row label="Est. clicks/mo"   value={`+${fmtNum(forecast.clicksDelta)}`} tone="good" />
          <Row label="Horizon"          value={`${forecast.horizonDays}d`} />
          <Row label="Confidence"       value={`${Math.round(forecast.confidence * 100)}%`} />
          <SourceChip sources={['Rules', 'GSC']} />
        </Card>
      )}

      <Card>
        <SectionTitle>Owner load</SectionTitle>
        {ownerLoad.length === 0
          ? <Row label="Unassigned" value="—" tone="muted" />
          : ownerLoad.map(o => (
              <Row key={o.owner} label={o.owner} value={fmtNum(o.count)} />
            ))}
        <SourceChip sources={['Crawler']} />
      </Card>
    </div>
  )
}
