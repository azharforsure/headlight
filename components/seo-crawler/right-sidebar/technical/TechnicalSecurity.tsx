import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, MetricRow,
  TopList, AlertRow, EmptyState,
  fmtPct,
} from '../_shared'

export function TechnicalSecurity() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Security Status" dense>
        <KpiRow>
          <KpiTile label="HTTPS" value={fmtPct(s.security.httpsPages / s.total * 100)} tone="good" />
          <KpiTile label="HSTS"  value={s.security.missingHsts === 0 ? 'Yes' : 'No'} tone={s.security.missingHsts === 0 ? 'good' : 'warn'} />
          <KpiTile label="CSP"   value={s.security.missingCsp === 0 ? 'Yes' : 'No'} tone={s.security.missingCsp === 0 ? 'good' : 'warn'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Risk Summary" dense>
        <MetricRow label="Mixed Content" value={s.security.mixedContent} tone={s.security.mixedContent > 0 ? 'bad' : 'good'} />
        <MetricRow label="Exposed Keys"  value={s.security.exposedKeys}  tone={s.security.exposedKeys > 0 ? 'bad' : 'good'} />
        <MetricRow label="Invalid SSL"   value={s.security.sslInvalid}   tone={s.security.sslInvalid > 0 ? 'bad' : 'good'} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.security.exposedKeys > 0 && (
          <AlertRow alert={{ id: 'k', tone: 'bad', title: 'Exposed API keys found', count: s.security.exposedKeys }} 
                    onClick={() => drill.toCategory('security', 'Exposed Keys')} />
        )}
        {s.security.mixedContent > 0 && (
          <AlertRow alert={{ id: 'm', tone: 'bad', title: 'Mixed content warnings', count: s.security.mixedContent }} 
                    onClick={() => drill.toCategory('security', 'Mixed Content')} />
        )}
      </Section></Card>
    </div>
  )
}
