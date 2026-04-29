import { pct, score100 } from './_helpers'
import { PaidOverviewTab, PaidSpendTab, PaidQualityTab, PaidLandingTab, PaidMatchTab } from '../../components/seo-crawler/right-sidebar/modes/paid'
import type { RsDataDeps, RsModeBundle } from './types'

export interface PaidStats {
	overallScore: number | null
	spend:  { last30: number | null; last7: number | null; cpcAvg: number | null; convCount: number | null }
	quality: { qsAvg: number | null; landingScoreAvg: number; landingPagesScored: number }
	landing: {
		total: number; fast: number; slow: number;
		ttfbAvg: number | null; httpsTotal: number;
		missingTitle: number; missingDesc: number
	}
	match: { kwToLandingMatch: number | null; lpToProductMatch: number | null }
	connections: { googleAds: boolean; metaAds: boolean }
}

export function computePaidStats(deps: RsDataDeps): PaidStats {
	const pages = deps.pages
	const gads = deps.integrationConnections?.['googleAds']?.status === 'connected'
	const meta = deps.integrationConnections?.['metaAds']?.status === 'connected'

	const landing = pages.filter(p => p['isLandingPage'] || /\/lp\//.test(p.url || ''))
	let fast = 0, slow = 0, ttfbSum = 0, ttfbCount = 0, https = 0
	let missingTitle = 0, missingDesc = 0, lpScoreSum = 0, lpScoreCount = 0
	for (const p of landing) {
		if ((p.loadTime ?? 0) <= 1500) fast++
		else if ((p.loadTime ?? 0) > 3500) slow++
		if (p.fieldTtfb) { ttfbSum += p.fieldTtfb; ttfbCount++ }
		if ((p.url || '').startsWith('https://')) https++
		if (!p.title?.trim()) missingTitle++
		if (!p.metaDesc?.trim()) missingDesc++
		if (typeof p['landingScore'] === 'number') { lpScoreSum += p['landingScore']; lpScoreCount++ }
	}

	const landingScoreAvg = lpScoreCount ? Math.round(lpScoreSum / lpScoreCount) : pct(fast, Math.max(1, landing.length))
	const overallScore = (gads || meta)
		? score100([
			{ weight: 2, value: landingScoreAvg },
			{ weight: 1, value: pct(https, Math.max(1, landing.length)) },
			{ weight: 1, value: 100 - pct(missingTitle + missingDesc, Math.max(1, landing.length * 2)) },
		  ])
		: null

	return {
		overallScore,
		spend: { last30: null, last7: null, cpcAvg: null, convCount: null },
		quality: { qsAvg: null, landingScoreAvg, landingPagesScored: lpScoreCount },
		landing: {
			total: landing.length, fast, slow,
			ttfbAvg: ttfbCount ? Math.round(ttfbSum / ttfbCount) : null,
			httpsTotal: https,
			missingTitle, missingDesc,
		},
		match: { kwToLandingMatch: null, lpToProductMatch: null },
		connections: { googleAds: gads, metaAds: meta },
	}
}

export const paidBundle: RsModeBundle<PaidStats> = {
	mode: 'paid',
	accent: 'cyan',
	defaultTabId: 'paid_overview',
	tabs: [
		{ id: 'paid_overview', label: 'Overview', Component: PaidOverviewTab },
		{ id: 'paid_spend',    label: 'Spend',    Component: PaidSpendTab },
		{ id: 'paid_quality',  label: 'Quality',  Component: PaidQualityTab },
		{ id: 'paid_landing',  label: 'Landing',  Component: PaidLandingTab },
		{ id: 'paid_match',    label: 'Match',    Component: PaidMatchTab },
	],
	computeStats: computePaidStats,
}
