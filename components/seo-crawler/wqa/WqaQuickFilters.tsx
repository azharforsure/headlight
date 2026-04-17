import React from 'react';
import { Zap } from 'lucide-react';
import { WQA_QUICK_FILTERS } from '../../../services/WqaQuickFilters';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export default function WqaQuickFilters() {
	const { applyWqaQuickFilter, activeWqaQuickFilterId } = useSeoCrawler();

	return (
		<div className="border-b border-[#1a1a1a] py-2">
			<div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#666]">
				<Zap size={11} /> Quick Filters
			</div>
			<div className="flex flex-wrap gap-1 px-3 pb-1 pt-1">
				{WQA_QUICK_FILTERS.map((q) => {
					const active = activeWqaQuickFilterId === q.id;
					return (
						<button
							key={q.id}
							onClick={() => applyWqaQuickFilter(q.id)}
							title={q.description}
							className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
								active
									? 'border-[#F5364E]/40 bg-[#F5364E]/10 text-[#F5364E]'
									: 'border-[#222] bg-[#0a0a0a] text-[#aaa] hover:border-[#333] hover:text-white'
							}`}
						>
							{q.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
