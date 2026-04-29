import { countWhere, pct, score100 } from './_helpers'
import { SocialOverviewTab, SocialOgTab, SocialEngagementTab, SocialMentionsTab, SocialActionsTab } from '../../components/seo-crawler/right-sidebar/modes/socialBrand'
import type { RsDataDeps, RsModeBundle } from './types'

export interface SocialStats {
	overallScore: number
	og:        { withOgTitle: number; withOgImage: number; withTwitterCard: number; total: number }
	engagement:{ connected: boolean; followers: number | null; postsLast30: number | null; engagementRate: number | null }
	mentions:  { connected: boolean; total: number | null; positive: number | null; negative: number | null }
	actions:   { id: string; label: string; effort: 'low' | 'medium' | 'high'; impact: number }[]
}

export function computeSocialStats(deps: RsDataDeps): SocialStats {
	const pages = deps.pages
	const n = pages.length
	const withOgTitle = countWhere(pages, p => !!p['ogTitle'])
	const withOgImage = countWhere(pages, p => !!p['ogImage'])
	const withTw = countWhere(pages, p => !!p['twitterCard'] || !!p['hasTwitterCard'])

	const ic = deps.integrationConnections ?? {}
	const connected = !!(ic['twitter']?.status === 'connected' || ic['facebook']?.status === 'connected' || ic['linkedin']?.status === 'connected')
	const overallScore = score100([
		{ weight: 2, value: pct(withOgTitle, n) },
		{ weight: 2, value: pct(withOgImage, n) },
		{ weight: 1, value: pct(withTw, n) },
	])

	const actions: SocialStats['actions'] = [
		{ id: 'add-og-title', label: `Add og:title to ${n - withOgTitle} pages`, effort: 'low' as const, impact: n - withOgTitle },
		{ id: 'add-og-image', label: `Add og:image to ${n - withOgImage} pages`, effort: 'medium' as const, impact: n - withOgImage },
		{ id: 'add-twitter-card', label: `Add twitter:card to ${n - withTw} pages`, effort: 'low' as const, impact: n - withTw },
	].filter(a => a.impact > 0)

	return {
		overallScore,
		og:        { withOgTitle, withOgImage, withTwitterCard: withTw, total: n },
		engagement:{ connected, followers: null, postsLast30: null, engagementRate: null },
		mentions:  { connected, total: null, positive: null, negative: null },
		actions,
	}
}

export const socialBundle: RsModeBundle<SocialStats> = {
	mode: 'socialBrand',
	accent: 'indigo',
	defaultTabId: 'social_overview',
	tabs: [
		{ id: 'social_overview',   label: 'Overview',   Component: SocialOverviewTab },
		{ id: 'social_og',         label: 'OG/Twitter', Component: SocialOgTab },
		{ id: 'social_engagement', label: 'Engagement', Component: SocialEngagementTab },
		{ id: 'social_mentions',   label: 'Mentions',   Component: SocialMentionsTab },
		{ id: 'social_actions',    label: 'Actions',    Component: SocialActionsTab },
	],
	computeStats: computeSocialStats,
}
