import React from 'react'
import { motion } from 'framer-motion'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { getRsTabsFor } from './registry'

export function RsTabBar() {
    const { mode, rsTab, setRsTab, pages } = useSeoCrawler()
    const reg = getRsTabsFor(mode)
    if (!reg) return null
    const activeId = rsTab[mode] ?? reg.tabs[0]?.id
    const styleNav = { 
        scrollbarWidth: 'none' as const,
        maskImage: 'linear-gradient(to right, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, black 95%, transparent)'
    }
    return (
        <nav className="flex items-center gap-0.5 border-b border-[#161616] px-1.5 py-1 overflow-x-auto shrink-0 snap-x snap-mandatory"
             style={styleNav}>
            {reg.tabs.map((tab) => {
                const active = tab.id === activeId
                const badge = tab.badge?.({ pages, site: {} })
                return (
                    <button
                        key={tab.id}
                        onClick={() => setRsTab(mode, tab.id)}
                        className={`relative shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 snap-start ${
                            active
                                ? 'text-white'
                                : 'text-[#888] hover:text-[#ccc] hover:bg-[#141414]'
                        }`}
                    >
                        {active && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-[#1a1a1a] rounded"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                        {badge !== undefined && badge !== '' && (
                            <span className={`relative z-10 text-[9px] font-mono px-1 rounded ${active ? 'text-[#F5364E]' : 'text-[#666]'}`}>
                                {badge}
                            </span>
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
