import { CompOverviewTab, CompGapTab, CompWinsTab, CompLossesTab, CompAnchorsTab } from '../../components/seo-crawler/right-sidebar/modes/competitors'
import type { RsDataDeps, RsModeBundle } from './types'

export interface CompetitorsStats {
	overallScore: number | null
	competitors: { domain: string; overlapPct: number | null; visibility: number | null }[] | null
	gap:    { keywords: number | null; theirs: number | null; mine: number | null }
	wins:   { rankUp: number | null; topGainers: { keyword: string; delta: number }[] | null }
	losses: { rankDown: number | null; topLosers: { keyword: string; delta: number }[] | null }
	anchors:{ shared: number | null; topAnchors: { text: string; count: number }[] | null }
	connections: { serp: boolean }
}

export function computeCompetitorsStats(deps: RsDataDeps): CompetitorsStats {
	const serp = deps.integrationConnections?.['serp']?.status === 'connected'
	return {
		overallScore: null,
		competitors: serp ? [] : null,
		gap:    { keywords: null, theirs: null, mine: null },
		wins:   { rankUp: null, topGainers: null },
		losses: { rankDown: null, topLosers: null },
		anchors:{ shared: null, topAnchors: null },
		connections: { serp },
	}
}

export const competitorsBundle: RsModeBundle<CompetitorsStats> = {
	mode: 'competitors',
	accent: 'red',
	defaultTabId: 'comp_overview',
	tabs: [
		{ id: 'comp_overview', label: 'Overview', Component: CompOverviewTab },
		{ id: 'comp_gap',      label: 'Gap',      Component: CompGapTab },
		{ id: 'comp_wins',     label: 'Wins',     Component: CompWinsTab },
		{ id: 'comp_losses',   label: 'Losses',   Component: CompLossesTab },
		{ id: 'comp_anchors',  label: 'Anchors',  Component: CompAnchorsTab },
	],
	computeStats: computeCompetitorsStats,
}
