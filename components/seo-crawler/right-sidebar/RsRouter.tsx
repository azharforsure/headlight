import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { getRsTabsFor } from './registry'
import { EmptyState } from './_shared'

export function RsRouter() {
    const { mode, rsTab } = useSeoCrawler()
    const reg = getRsTabsFor(mode)
    if (!reg) {
        return (
            <div className="p-3">
                <EmptyState
                    title="Insights for this mode are coming next."
                    hint="Switch to Full Audit to see the completed sidebar."
                />
            </div>
        )
    }
    const activeId = rsTab[mode] ?? reg.tabs[0].id
    const tab = reg.tabs.find(t => t.id === activeId) ?? reg.tabs[0]
    const Component = tab.Component
    return (
        <div>
            <Component />
        </div>
    )
}
