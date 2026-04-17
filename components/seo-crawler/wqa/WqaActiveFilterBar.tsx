import React from 'react';
import { X } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

type Chip = { key: string; label: string; onClear: () => void };

export default function WqaActiveFilterBar() {
	const { wqaFilter, setWqaFilter, clearWqaFilter, filteredWqaPagesExport } =
		useSeoCrawler();

	const chips: Chip[] = [];
	const f = wqaFilter;
	const set = (patch: Partial<typeof wqaFilter>) =>
		setWqaFilter({ ...wqaFilter, ...patch });

	if (f.searchTerm)
		chips.push({
			key: 'search',
			label: `"${f.searchTerm}"`,
			onClear: () => set({ searchTerm: '' }),
		});
	if (f.pageCategory !== 'all')
		chips.push({
			key: 'cat',
			label: `Category: ${f.pageCategory}`,
			onClear: () => set({ pageCategory: 'all' }),
		});
	if (f.priorityLevel !== 0)
		chips.push({
			key: 'pri',
			label: `P${f.priorityLevel}`,
			onClear: () => set({ priorityLevel: 0 }),
		});
	if (f.valueTier !== 'all')
		chips.push({
			key: 'value',
			label: `Value ${f.valueTier}`,
			onClear: () => set({ valueTier: 'all' }),
		});
	if (f.trafficStatus !== 'all')
		chips.push({
			key: 'traffic',
			label: `Traffic: ${f.trafficStatus}`,
			onClear: () => set({ trafficStatus: 'all' }),
		});
	if (f.searchStatus !== 'all')
		chips.push({
			key: 'search-pos',
			label: `Position: ${f.searchStatus}`,
			onClear: () => set({ searchStatus: 'all' }),
		});
	if (f.technicalAction !== 'all')
		chips.push({
			key: 'tech',
			label: `Tech: ${f.technicalAction}`,
			onClear: () => set({ technicalAction: 'all' }),
		});
	if (f.contentAction !== 'all')
		chips.push({
			key: 'content',
			label: `Content: ${f.contentAction}`,
			onClear: () => set({ contentAction: 'all' }),
		});
	if (f.contentAge !== 'all')
		chips.push({
			key: 'age',
			label: `Age: ${f.contentAge}`,
			onClear: () => set({ contentAge: 'all' }),
		});
	if (f.indexability !== 'all')
		chips.push({
			key: 'index',
			label: `Index: ${f.indexability}`,
			onClear: () => set({ indexability: 'all' }),
		});
	if (f.funnelStage !== 'all')
		chips.push({
			key: 'funnel',
			label: `Funnel: ${f.funnelStage}`,
			onClear: () => set({ funnelStage: 'all' }),
		});
	if (f.industryFilter !== 'all')
		chips.push({
			key: 'industry',
			label: `Industry: ${f.industryFilter}`,
			onClear: () => set({ industryFilter: 'all' }),
		});

	if (chips.length === 0) return null;

	return (
		<div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
			<span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
				{filteredWqaPagesExport.length.toLocaleString()} matches
			</span>
			<div className="flex flex-wrap items-center gap-1">
				{chips.map((chip) => (
					<button
						key={chip.key}
						onClick={chip.onClear}
						className="flex items-center gap-1 rounded-full border border-[#222] bg-[#111] px-2 py-0.5 text-[10px] text-[#ccc] hover:border-[#333] hover:text-white"
					>
						{chip.label}
						<X size={9} className="text-[#666]" />
					</button>
				))}
				<button
					onClick={clearWqaFilter}
					className="ml-1 text-[10px] text-[#666] hover:text-white"
				>
					Clear all
				</button>
			</div>
		</div>
	);
}
