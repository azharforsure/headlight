import type React from 'react'
import type { Mode } from '@headlight/types'
import { fullAuditTabs }    from './full-audit'
import { wqaTabs }          from './wqa'
import { technicalTabs }    from './technical'
import { contentTabs }      from './content'
import { linksTabs }        from './links'
import { uxTabs }           from './ux'
import { paidTabs }         from './paid'
import { commerceTabs }     from './commerce'
import { socialTabs }       from './social'
import { aiTabs }           from './ai'
import { competitorsTabs }  from './competitors'
import { localTabs }        from './local'

export type RsTabDescriptor = {
  id: string
  label: string
  Component: React.FC
  badge?: (state: { pages: any[]; site: any }) => number | string | undefined
}

export type RsRegistry = Partial<Record<Mode, {
  label: string
  accent: string
  tabs: RsTabDescriptor[]
}>>

export const RS_REGISTRY: RsRegistry = {
  fullAudit:      { label: 'Full audit',         accent: '#94a3b8', tabs: fullAuditTabs },
  wqa:            { label: 'Web quality',        accent: '#a78bfa', tabs: wqaTabs },
  technical:      { label: 'Technical',          accent: '#3b82f6', tabs: technicalTabs },
  content:        { label: 'Content',            accent: '#f59e0b', tabs: contentTabs },
  linksAuthority: { label: 'Links & authority',  accent: '#14b8a6', tabs: linksTabs },
  uxConversion:   { label: 'UX & conversion',    accent: '#f43f5e', tabs: uxTabs },
  paid:           { label: 'Paid',               accent: '#06b6d4', tabs: paidTabs },
  commerce:       { label: 'Commerce',           accent: '#10b981', tabs: commerceTabs },
  socialBrand:    { label: 'Social & brand',     accent: '#6366f1', tabs: socialTabs },
  ai:             { label: 'AI & answer engines', accent: '#d946ef', tabs: aiTabs },
  competitors:    { label: 'Competitors',        accent: '#ef4444', tabs: competitorsTabs },
  local:          { label: 'Local',              accent: '#f97316', tabs: localTabs },
}

export function getRsTabsFor(mode: Mode) {
  return RS_REGISTRY[mode] ?? null
}
