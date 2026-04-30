// modes/local/PackTab.tsx
import React from 'react'
import { Card, Row, MiniBar, SourceChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { LocalStats } from '@/services/right-sidebar/local'

export function LocalPackTab({ stats }: RsTabProps<LocalStats>) {
  const p = stats.pack
  if (p.keywords.length === 0) return <RsPartial title="No tracked local keywords" reason="Add local keywords in left sidebar settings." />
  const SRC = { tier: 'authoritative', name: 'Local rank tracker' } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Map pack visibility" right={<SourceChip source={SRC} />}>
        <Row label="In pack" value={`${p.inPackPct}%`} tone={p.inPackPct >= 50 ? 'good' : 'warn'} />
        <MiniBar value={p.inPackPct} max={100} tone={p.inPackPct >= 50 ? 'good' : 'warn'} />
      </Card>
      <Card title="By keyword">
        {p.keywords.slice(0, 12).map(k => (
          <Row key={k.keyword} label={k.keyword} value={k.rank == null ? 'out' : `#${k.rank}`} tone={k.rank == null ? 'bad' : k.rank <= 3 ? 'good' : 'warn'} />
        ))}
      </Card>
    </div>
  )
}
