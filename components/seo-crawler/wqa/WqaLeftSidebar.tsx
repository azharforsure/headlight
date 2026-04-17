import React, { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import WqaSearchBox from './WqaSearchBox';
import WqaQuickFilters from './WqaQuickFilters';
import WqaSavedViews from './WqaSavedViews';
import WqaFilterSection from './WqaFilterSection';
import { formatIndustryLabel } from './wqaUtils';

type Facet = Record<string, number>;

const toOptions = (
	facet: Facet,
	labelMap?: Record<string, string>,
): Array<{ value: string; label: string; count: number }> => {
	return Object.entries(facet).map(([value, count]) => ({
		value,
		label: labelMap?.[value] || value,
		count,
	}));
};

export default function WqaLeftSidebar() {
	const { wqaFilter, setWqaFilter, wqaFacets, clearWqaFilter, leftSidebarWidth, setIsDraggingLeftSidebar } = useSeoCrawler();

	const total = wqaFacets.total;

	const categoryOptions = useMemo(
		() => [
			{ value: 'all', label: 'All categories', count: total },
			...toOptions(wqaFacets.categories),
		],
		[wqaFacets, total],
	);

	const techActionOptions = useMemo(
		() => [
			{ value: 'all', label: 'All technical actions', count: total },
			...toOptions(wqaFacets.technicalActions),
		],
		[wqaFacets, total],
	);

	const contentActionOptions = useMemo(
		() => [
			{ value: 'all', label: 'All content actions', count: total },
			...toOptions(wqaFacets.contentActions),
		],
		[wqaFacets, total],
	);

	const priorityOptions = [
		{ value: '0', label: 'Any priority', count: total },
		{ value: '1', label: 'P1 — Critical', count: wqaFacets.priorities['1'] },
		{ value: '2', label: 'P2 — High', count: wqaFacets.priorities['2'] },
		{ value: '3', label: 'P3 — Normal', count: wqaFacets.priorities['3'] },
	];

	const valueOptions = [
		{ value: 'all', label: 'Any value', count: total },
		{ value: '★★★', label: '★★★ Top', count: wqaFacets.valueTiers['★★★'] },
		{ value: '★★', label: '★★ High', count: wqaFacets.valueTiers['★★'] },
		{ value: '★', label: '★ Medium', count: wqaFacets.valueTiers['★'] },
		{ value: '☆', label: '☆ Low', count: wqaFacets.valueTiers['☆'] },
	];

	const trafficOptions = [
		{ value: 'all', label: 'Any traffic state', count: total },
		{ value: 'growing', label: 'Growing', count: wqaFacets.trafficStatuses.growing },
		{ value: 'declining', label: 'Declining', count: wqaFacets.trafficStatuses.declining },
		{ value: 'stable', label: 'Stable', count: wqaFacets.trafficStatuses.stable },
		{ value: 'none', label: 'No traffic', count: wqaFacets.trafficStatuses.none },
	];

	const searchOptions = [
		{ value: 'all', label: 'Any position', count: total },
		{ value: 'top3', label: 'Top 3', count: wqaFacets.searchStatuses.top3 },
		{ value: 'page1', label: 'Page 1 (4–10)', count: wqaFacets.searchStatuses.page1 },
		{ value: 'striking', label: 'Striking (4–20)', count: wqaFacets.searchStatuses.striking },
		{ value: 'weak', label: 'Beyond page 2', count: wqaFacets.searchStatuses.weak },
		{ value: 'none', label: 'No rankings', count: wqaFacets.searchStatuses.none },
	];

	const ageOptions = [
		{ value: 'all', label: 'Any age', count: total },
		{ value: 'fresh', label: 'Fresh (≤ 6 mo)', count: wqaFacets.contentAges.fresh },
		{ value: 'aging', label: 'Aging (6–18 mo)', count: wqaFacets.contentAges.aging },
		{ value: 'stale', label: 'Stale (> 18 mo)', count: wqaFacets.contentAges.stale },
		{ value: 'nodate', label: 'No date', count: wqaFacets.contentAges.nodate },
	];

	const indexOptions = [
		{ value: 'all', label: 'Any status', count: total },
		{ value: 'indexed', label: 'Indexed', count: wqaFacets.indexabilities.indexed },
		{ value: 'blocked', label: 'Blocked / Noindex', count: wqaFacets.indexabilities.blocked },
		{ value: 'redirect', label: 'Redirect', count: wqaFacets.indexabilities.redirect },
		{ value: 'error', label: 'Error', count: wqaFacets.indexabilities.error },
	];

	const funnelOptions = useMemo(
		() => [
			{ value: 'all', label: 'Any stage', count: total },
			...toOptions(wqaFacets.funnelStages),
		],
		[wqaFacets, total],
	);

	const industryLabelMap = useMemo(() => {
		const m: Record<string, string> = { all: 'All industry pages' };
		for (const key of Object.keys(wqaFacets.categories)) {
			m[key] = formatIndustryLabel(key);
		}
		return m;
	}, [wqaFacets]);

	return (
		<aside 
			style={{ width: leftSidebarWidth }}
			className="flex h-full flex-col overflow-hidden bg-[#0a0a0a] border-r border-[#1a1a1a] relative shrink-0"
		>
			<div
				onMouseDown={() => setIsDraggingLeftSidebar(true)}
				className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
			></div>

			<div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2 shrink-0">
				<span className="text-[11px] font-bold uppercase tracking-widest text-white">
					Filters
				</span>
				<button
					onClick={clearWqaFilter}
					className="flex items-center gap-1 text-[10px] text-[#555] hover:text-white"
					title="Reset all filters"
				>
					<RotateCcw size={10} /> Clear
				</button>
			</div>

			<WqaSearchBox />
			<WqaQuickFilters />
			<WqaSavedViews />

			<div className="flex-1 overflow-y-auto custom-scrollbar">
				<WqaFilterSection
					title="Page Category"
					options={categoryOptions}
					activeValue={wqaFilter.pageCategory}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, pageCategory: v })}
				/>
				<WqaFilterSection
					title="Priority"
					options={priorityOptions}
					activeValue={String(wqaFilter.priorityLevel)}
					onSelect={(v) =>
						setWqaFilter({ ...wqaFilter, priorityLevel: Number(v) as 0 | 1 | 2 | 3 })
					}
				/>
				<WqaFilterSection
					title="Value Tier"
					options={valueOptions}
					activeValue={wqaFilter.valueTier}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, valueTier: v as any })}
				/>
				<WqaFilterSection
					title="Search Position"
					options={searchOptions}
					activeValue={wqaFilter.searchStatus}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, searchStatus: v as any })}
				/>
				<WqaFilterSection
					title="Traffic Trend"
					options={trafficOptions}
					activeValue={wqaFilter.trafficStatus}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, trafficStatus: v as any })}
				/>
				<WqaFilterSection
					title="Technical Action"
					options={techActionOptions}
					activeValue={wqaFilter.technicalAction}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, technicalAction: v })}
				/>
				<WqaFilterSection
					title="Content Action"
					options={contentActionOptions}
					activeValue={wqaFilter.contentAction}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, contentAction: v })}
				/>
				<WqaFilterSection
					title="Content Age"
					options={ageOptions}
					activeValue={wqaFilter.contentAge}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, contentAge: v as any })}
				/>
				<WqaFilterSection
					title="Indexability"
					options={indexOptions}
					activeValue={wqaFilter.indexability}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, indexability: v as any })}
				/>
				<WqaFilterSection
					title="Funnel Stage"
					options={funnelOptions}
					activeValue={wqaFilter.funnelStage}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, funnelStage: v as any })}
					defaultOpen={false}
				/>
				<WqaFilterSection
					title="Industry Overlay"
					options={[
						{ value: 'all', label: 'All pages', count: total },
						...toOptions(wqaFacets.categories, industryLabelMap),
					]}
					activeValue={wqaFilter.industryFilter}
					onSelect={(v) => setWqaFilter({ ...wqaFilter, industryFilter: v })}
					defaultOpen={false}
				/>
			</div>
		</aside>
	);
}
