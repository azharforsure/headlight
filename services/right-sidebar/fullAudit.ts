import {
	countWhere, isHttpOk, isHttpError, isIndexable, hasTitle, hasMetaDescription,
	hasH1, isThin, isHeavy, pct, score100,
} from './_helpers'
import {
	FaOverviewTab, FaIssuesTab, FaScoresTab, FaCrawlTab, FaIntegrationsTab,
} from '../../components/seo-crawler/right-sidebar/modes/fullAudit'
import type { RsDataDeps, RsModeBundle } from './types'

export interface FaSiteStats {
	overallScore: number          // 0..100
	indexabilityScore: number
	contentScore: number
	technicalScore: number
	performanceScore: number
	totals: {
		pages: number
		indexable: number
		withErrors: number
		withIssues: number
	}
	issuesByCategory: Array<{ category: string; count: number; severity: 'critical' | 'warning' | 'notice' }>
	crawlSummary: {
		totalCrawled: number
		httpOk: number
		http3xx: number
		http4xx: number
		http5xx: number
		avgResponseMs: number | null
	}
	integrationCoverage: { connected: number; total: number }
}

export function computeFaStats(deps: RsDataDeps): FaSiteStats {
	const pages = deps.pages
	const total = pages.length
	const ok = countWhere(pages, isHttpOk)
	const h3 = countWhere(pages, p => (p.statusCode ?? 0) >= 300 && (p.statusCode ?? 0) < 400)
	const h4 = countWhere(pages, p => (p.statusCode ?? 0) >= 400 && (p.statusCode ?? 0) < 500)
	const h5 = countWhere(pages, p => (p.statusCode ?? 0) >= 500)
	const indexable = countWhere(pages, isIndexable)
	const withTitle = countWhere(pages, hasTitle)
	const withDesc = countWhere(pages, hasMetaDescription)
	const withH1 = countWhere(pages, hasH1)
	const thin = countWhere(pages, isThin)
	const heavy = countWhere(pages, isHeavy)
	const withErrors = countWhere(pages, isHttpError)

	const respTimes = pages.map(p => p.loadTime ?? 0).filter(Boolean)
	const avgResp = respTimes.length ? Math.round(respTimes.reduce((s, n) => s + n, 0) / respTimes.length) : null

	const indexabilityScore = pct(indexable, total) // 0..100
	const contentScore = score100([
		{ weight: 1, value: pct(withTitle, total) },
		{ weight: 1, value: pct(withDesc, total) },
		{ weight: 1, value: pct(withH1, total) },
		{ weight: 1, value: 100 - pct(thin, total) },
	])
	const technicalScore = score100([
		{ weight: 2, value: pct(ok, total) },
		{ weight: 1, value: 100 - pct(heavy, total) },
	])
	const performanceScore = avgResp == null ? 50 : Math.max(0, Math.min(100, 100 - (avgResp / 30)))
	const overallScore = score100([
		{ weight: 2, value: indexabilityScore },
		{ weight: 2, value: contentScore },
		{ weight: 2, value: technicalScore },
		{ weight: 1, value: performanceScore },
	])

	const issuesByCategory = [
		{ category: 'Missing title',       count: total - withTitle, severity: 'critical' as const },
		{ category: 'Missing description', count: total - withDesc,  severity: 'warning'  as const },
		{ category: 'Missing H1',          count: total - withH1,    severity: 'warning'  as const },
		{ category: 'Thin content',        count: thin,              severity: 'warning'  as const },
		{ category: 'Heavy page (>2MB)',   count: heavy,             severity: 'notice'   as const },
		{ category: '4xx errors',          count: h4,                severity: 'critical' as const },
		{ category: '5xx errors',          count: h5,                severity: 'critical' as const },
	].filter(i => i.count > 0)

	const connections = deps.integrationConnections ?? {}
	const integrationKeys = ['gsc', 'ga4', 'gbp', 'googleAds', 'metaAds', 'shopify', 'woocommerce', 'magento', 'twitter', 'facebook', 'linkedin']
	const connected = integrationKeys.filter(k => connections[k]?.status === 'connected').length

	return {
		overallScore,
		indexabilityScore, contentScore, technicalScore, performanceScore,
		totals: { pages: total, indexable, withErrors, withIssues: issuesByCategory.reduce((s, i) => s + i.count, 0) },
		issuesByCategory,
		crawlSummary: { totalCrawled: total, httpOk: ok, http3xx: h3, http4xx: h4, http5xx: h5, avgResponseMs: avgResp },
		integrationCoverage: { connected, total: integrationKeys.length },
	}
}

export const fullAuditBundle: RsModeBundle<FaSiteStats> = {
	mode: 'fullAudit',
	accent: 'slate',
	defaultTabId: 'fa_overview',
	tabs: [
		{ id: 'fa_overview',     label: 'Overview',     Component: FaOverviewTab },
		{ id: 'fa_issues',       label: 'Issues',       Component: FaIssuesTab },
		{ id: 'fa_scores',       label: 'Scores',       Component: FaScoresTab },
		{ id: 'fa_crawl',        label: 'Crawl',        Component: FaCrawlTab },
		{ id: 'fa_integrations', label: 'Integrations', Component: FaIntegrationsTab },
	],
	computeStats: computeFaStats,
}
