import type { WqaFilterState } from './WqaFilterEngine';
import { DEFAULT_WQA_FILTER } from './WqaFilterEngine';

export interface WqaQuickFilter {
	id: string;
	label: string;
	description: string;
	patch: Partial<WqaFilterState>;
}

export const WQA_QUICK_FILTERS: WqaQuickFilter[] = [
	{
		id: 'quick_wins',
		label: 'Quick Wins',
		description: 'Striking distance + healthy tech + high impressions',
		patch: { searchStatus: 'striking', priorityLevel: 2 },
	},
	{
		id: 'losing_traffic',
		label: 'Losing Traffic',
		description: 'Pages with declining sessions vs previous period',
		patch: { trafficStatus: 'declining' },
	},
	{
		id: 'striking_distance',
		label: 'Striking Distance',
		description: 'Positions 4–20 with real impressions',
		patch: { searchStatus: 'striking' },
	},
	{
		id: 'no_search_traffic',
		label: 'No Search Traffic',
		description: 'Indexed but no impressions or clicks',
		patch: { searchStatus: 'none', indexability: 'indexed' },
	},
	{
		id: 'thin_content',
		label: 'Thin Content',
		description: 'Pages flagged for content rewrite',
		patch: { contentAction: 'Rewrite Content' },
	},
	{
		id: 'broken_or_redirect',
		label: 'Broken / Redirects',
		description: 'Non-200 pages still linked or in sitemap',
		patch: { indexability: 'error' },
	},
	{
		id: 'orphans',
		label: 'Orphans',
		description: 'Zero inlinks but indexable',
		patch: { technicalAction: 'Add Internal Links' },
	},
	{
		id: 'stale',
		label: 'Stale Content',
		description: 'Not updated in 18+ months',
		patch: { contentAge: 'stale' },
	},
	{
		id: 'high_value_low_engagement',
		label: 'High Value · Low Engagement',
		description: 'Top value tier with high bounce or short time',
		patch: { valueTier: '★★★', trafficStatus: 'declining' },
	},
];

export function applyQuickFilterPatch(
	current: WqaFilterState,
	patch: Partial<WqaFilterState>,
): WqaFilterState {
	return { ...DEFAULT_WQA_FILTER, searchTerm: current.searchTerm, ...patch };
}
