import React from 'react'

type Conn = { id: string; label: string; connected: boolean; lastSync?: string }

type Props = {
  connectors: {
    gsc:    { connected: boolean; lastSync?: string }
    ga4:    { connected: boolean; lastSync?: string }
    crux:   { connected: boolean; lastSync?: string }
    ahrefs: { connected: boolean; lastSync?: string }
    bingWmt:{ connected: boolean; lastSync?: string }
    llmsTxt:{ connected: boolean; path?: string }
  }
  onConnect?: (id: string) => void
}

function fmtAgo(iso?: string) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600000)
  if (h < 1) return `${Math.floor(ms / 60000)}m`
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function ConnectorStatusBlock({ connectors, onConnect }: Props) {
  if (!connectors) return null
  const rows: Conn[] = [
    { id: 'gsc',     label: 'Google Search Console', connected: connectors.gsc.connected,    lastSync: connectors.gsc.lastSync },
    { id: 'ga4',     label: 'Google Analytics 4',    connected: connectors.ga4.connected,    lastSync: connectors.ga4.lastSync },
    { id: 'crux',    label: 'CrUX (Core Web Vitals)',connected: connectors.crux.connected,   lastSync: connectors.crux.lastSync },
    { id: 'bingWmt', label: 'Bing Webmaster',        connected: connectors.bingWmt.connected,lastSync: connectors.bingWmt.lastSync },
    { id: 'ahrefs',  label: 'Backlinks (Ahrefs / SEMrush)', connected: connectors.ahrefs.connected, lastSync: connectors.ahrefs.lastSync },
    { id: 'llmsTxt', label: 'llms.txt',              connected: connectors.llmsTxt.connected,lastSync: undefined },
  ]
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">Connectors</div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-2 text-neutral-300">
              <span className={`h-1.5 w-1.5 rounded-full ${r.connected ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
              {r.label}
            </span>
            <span className="text-[11px] text-neutral-500">
              {r.connected ? fmtAgo(r.lastSync) : (
                <button onClick={() => onConnect?.(r.id)} className="text-neutral-300 hover:text-white">Connect</button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
