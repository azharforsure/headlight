import type React from 'react'
import type { Mode } from '../../../contexts/SeoCrawlerContext'

export type RsTabDescriptor = {
    id: string
    label: string
    Component: React.FC
    /** Optional. Computes a small badge count next to the tab. */
    badge?: (state: { pages: any[]; site: any }) => number | string | undefined
}

export type RsRegistry = Partial<Record<Mode, {
    label: string
    accent: string
    tabs: RsTabDescriptor[]
}>>

import { fullAuditTabs } from './full-audit/index'

export const RS_REGISTRY: RsRegistry = {
    fullAudit: {
        label: 'Full Audit',
        accent: '#F5364E',
        tabs: fullAuditTabs,
    },
    // Other modes register here later.
}

export function getRsTabsFor(mode: Mode) {
    return RS_REGISTRY[mode] ?? null
}
