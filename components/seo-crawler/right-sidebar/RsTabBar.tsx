import React from 'react'
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext'
import { getBundle } from '../../../services/right-sidebar/registry'

export function RsTabBar() {
	const { mode, rsTab, setRsTab } = useSeoCrawler()
	const bundle = getBundle(mode)
	if (!bundle) return null

	const activeId = rsTab[mode] ?? bundle.defaultTabId

	return (
		<div className="h-[32px] border-b border-[#1a1a1a] flex items-stretch bg-[#0d0d0d] shrink-0 overflow-x-auto custom-scrollbar-hidden">
			{bundle.tabs.map((tab) => {
				const isActive = tab.id === activeId
				return (
					<button
						key={tab.id}
						onClick={() => setRsTab(mode, tab.id)}
						className={`px-3 text-[11px] font-medium border-r border-[#1a1a1a] whitespace-nowrap transition-colors border-t-2 ${
							isActive
								? 'bg-[#111] text-white border-t-[#F5364E]'
								: 'bg-transparent text-[#888] hover:text-[#ccc] hover:bg-[#111] border-t-transparent'
						}`}
					>
						{tab.label}
					</button>
				)
			})}
		</div>
	)
}
