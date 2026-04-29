import { countWhere, pct, score100 } from './_helpers'
import { LocalOverviewTab, LocalNapTab, LocalGbpTab, LocalReviewsTab, LocalPackTab } from '../../components/seo-crawler/right-sidebar/modes/local'
import type { RsDataDeps, RsModeBundle } from './types'

export interface LocalStats {
	overallScore: number
	nap: { withLocalBusiness: number; withPostalAddress: number; withPhone: number; withGeo: number; total: number; mismatchSuspect: number }
	gbp: { connected: boolean; profileFound: boolean | null; reviewCount: number | null; ratingAvg: number | null; postsLast30: number | null }
	reviews: { onSite: number; aggregateRatingPages: number }
	pack: { topQueries: { keyword: string; rank: number | null }[] | null }
}

export function computeLocalStats(deps: RsDataDeps): LocalStats {
	const pages = deps.pages
	const n = pages.length
	let lb = 0, addr = 0, phone = 0, geo = 0, mismatch = 0
	let onSiteReviews = 0, aggregateRatingPages = 0
	const phones = new Set<string>()
	for (const p of pages) {
		const t = Array.isArray(p['schemaTypes']) ? p['schemaTypes'] : []
		if (t.includes('LocalBusiness') || t.includes('Restaurant') || t.includes('Store')) lb++
		if (t.includes('PostalAddress') || p['postalAddress']) addr++
		if (p['phone']) { phone++; phones.add((p['phone'] as string).replace(/\D/g, '')) }
		if (p['geo']?.lat && p['geo']?.lng) geo++
		const revs = p['reviews'] as any[]
		if (Array.isArray(revs) && revs.length) onSiteReviews += revs.length
		if (t.includes('AggregateRating')) aggregateRatingPages++
	}
	if (phones.size > 1) mismatch = phones.size

	const gbpConnected = deps.integrationConnections?.['gbp']?.status === 'connected'
	const overallScore = score100([
		{ weight: 2, value: pct(lb, Math.max(1, n)) * 4 },
		{ weight: 1, value: pct(addr, Math.max(1, n)) * 4 },
		{ weight: 1, value: pct(phone, Math.max(1, n)) * 4 },
		{ weight: 1, value: 100 - pct(mismatch, 5) * 20 },
	])

	return {
		overallScore,
		nap: { withLocalBusiness: lb, withPostalAddress: addr, withPhone: phone, withGeo: geo, total: n, mismatchSuspect: mismatch },
		gbp: { connected: gbpConnected, profileFound: null, reviewCount: null, ratingAvg: null, postsLast30: null },
		reviews: { onSite: onSiteReviews, aggregateRatingPages },
		pack: { topQueries: null },
	}
}

export const localBundle: RsModeBundle<LocalStats> = {
	mode: 'local',
	accent: 'orange',
	defaultTabId: 'local_overview',
	tabs: [
		{ id: 'local_overview', label: 'Overview', Component: LocalOverviewTab },
		{ id: 'local_nap',      label: 'NAP',      Component: LocalNapTab },
		{ id: 'local_gbp',      label: 'GBP',      Component: LocalGbpTab },
		{ id: 'local_reviews',  label: 'Reviews',  Component: LocalReviewsTab },
		{ id: 'local_pack',     label: 'Pack',     Component: LocalPackTab },
	],
	computeStats: computeLocalStats,
}
