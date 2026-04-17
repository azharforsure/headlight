import React from 'react';
import { Search, X } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export default function WqaSearchBox() {
	const { wqaFilter, setWqaFilter } = useSeoCrawler();

	return (
		<div className="relative px-3 py-2">
			<Search
				size={11}
				className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#555]"
			/>
			<input
				id="wqa-search"
				value={wqaFilter.searchTerm}
				onChange={(e) =>
					setWqaFilter({ ...wqaFilter, searchTerm: e.target.value })
				}
				placeholder="Search URL, title, H1…"
				className="h-7 w-full rounded border border-[#222] bg-[#0a0a0a] pl-6 pr-6 text-[11px] text-white placeholder-[#555] outline-none focus:border-[#333]"
			/>
			{wqaFilter.searchTerm && (
				<button
					onClick={() => setWqaFilter({ ...wqaFilter, searchTerm: '' })}
					className="absolute right-5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
				>
					<X size={11} />
				</button>
			)}
		</div>
	);
}
