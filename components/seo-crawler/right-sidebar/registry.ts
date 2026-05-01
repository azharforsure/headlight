// components/seo-crawler/right-sidebar/registry.ts
import type React from 'react'
import type { Mode } from '@headlight/types'
import { fullAuditTabs } from './full-audit'
import { wqaTabs } from './wqa'
import { technicalTabs } from './technical'

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
  fullAudit: { label: 'Full Audit',       accent: '#F5364E', tabs: fullAuditTabs },
  wqa:       { label: 'Website Quality',  accent: '#F5364E', tabs: wqaTabs },
  technical: { label: 'Technical',        accent: '#3b82f6', tabs: technicalTabs },
}

export function getRsTabsFor(mode: Mode) {
  return RS_REGISTRY[mode] ?? null
}
