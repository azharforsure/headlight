// components/seo-crawler/right-sidebar/full-audit/FullAuditIntegrations.tsx
import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { Card } from '../_shared/Card'
import { ConnectorStatusBlock } from '../_shared/ConnectorStatusBlock'
import { FreshnessChip } from '../_shared/FreshnessChip'

type ConnectorState = 'connected' | 'disconnected' | 'error'
type Connector = {
  id: string
  label: string
  state: ConnectorState
  lastSyncAt?: string | null
  coveragePct?: number
  coverageLabel?: string
  helpHref?: string
}

const ORDER: { id: string; label: string }[] = [
  { id: 'gsc', label: 'Google Search Console' },
  { id: 'bing', label: 'Bing Webmaster' },
  { id: 'gbp', label: 'Google Business Profile' },
  { id: 'backlinks', label: 'Backlinks' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'ai', label: 'AI router' },
  { id: 'mcp', label: 'MCP' },
]

export default function FullAuditIntegrations() {
  const { site, openSettings } = useSeoCrawler() as any
  const conns: Record<string, Connector> = site?.connectors ?? {}
  const list = ORDER.map((o) => conns[o.id] ?? { id: o.id, label: o.label, state: 'disconnected' as ConnectorState })

  const missing = list.filter((c) => c.state === 'disconnected').map((c) => c.label)

  return (
    <div className="flex flex-col gap-3 p-3">
      {list.map((c) => (
        <ConnectorStatusBlock
          key={c.id}
          id={c.id}
          label={c.label}
          state={c.state}
          coveragePct={c.coveragePct}
          coverageLabel={c.coverageLabel}
          right={c.lastSyncAt ? <FreshnessChip iso={c.lastSyncAt} /> : null}
          onConfigure={() => openSettings?.('integrations', c.id)}
        />
      ))}

      {missing.length > 0 && (
        <Card title="Missing">
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m} className="rounded-sm border border-[#222] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#ccc]">{m}</li>
            ))}
          </ul>
          <button
            onClick={() => openSettings?.('integrations')}
            className="mt-2 text-[11px] text-[#3b82f6] hover:underline"
          >
            Open settings →
          </button>
        </Card>
      )}
    </div>
  )
}
