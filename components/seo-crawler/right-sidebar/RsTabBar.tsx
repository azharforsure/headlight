import React from 'react'
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext'
import { getRsTabsFor } from './registry'

export function RsTabBar() {
    const { mode, rsTab, setRsTab, pages } = useSeoCrawler()
    const reg = getRsTabsFor(mode)
    if (!reg) return null
    const activeId = rsTab[mode] ?? reg.tabs[0]?.id
    return (
        <nav className="flex items-center gap-0.5 border-b border-[#161616] px-1.5 py-1 overflow-x-auto shrink-0"
             style={{ scrollbarWidth: 'none' }}>
            {reg.tabs.map((tab) => {
                const active = tab.id === activeId
                const badge = tab.badge?.({ pages, site: {} })
                return (
                    <button
                        key={tab.id}
                        onClick={() => setRsTab(mode, tab.id)}
                        className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                            active
                                ? 'bg-[#1a1a1a] text-white'
                                : 'text-[#888] hover:text-[#ccc] hover:bg-[#141414]'
                        }`}
                    >
                        {tab.label}
                        {badge !== undefined && badge !== '' && (
                            <span className={`text-[9px] font-mono px-1 rounded ${active ? 'text-[#F5364E]' : 'text-[#666]'}`}>
                                {badge}
                            </span>
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
