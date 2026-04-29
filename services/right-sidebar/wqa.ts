import {
	countWhere, isIndexable, hasTitle, hasMetaDescription, hasH1, isThin, pct, score100, topN,
} from './_helpers'
import { WqaOverviewTab, WqaActionsTab, WqaSearchTab, WqaTechTab, WqaContentTab } from '../../components/seo-crawler/right-sidebar/modes/wqa'
import type { RsDataDeps, RsModeBundle } from './types'

export interface WqaStats {
	overallScore: number
	radar: { axis: string; value: number }[]   // length 5
	heroChips: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }[]
	actions: { id: string; label: string; effort: 'low' | 'medium' | 'high'; impact: number; filter?: unknown }[]
	search: {
		indexable: number; nonIndexable: number; canonicalIssues: number; sitemapMissing: number; sitemapTotal: number
	}
	tech: {
		https: number; httpsTotal: number
		avgResponseMs: number | null
		heavyPages: number
		slowPages: number
	}
	content: {
		withTitle: number; withDesc: number; withH1: number; thin: number
		dupTitles: number; dupDescriptions: number
		avgWords: number
	}
}

export function computeWqaStats(deps: RsDataDeps): WqaStats {
	const pages = deps.pages
	const n = pages.length

	const indexable = countWhere(pages, isIndexable)
	const withTitle = countWhere(pages, hasTitle)
	const withDesc = countWhere(pages, hasMetaDescription)
	const withH1 = countWhere(pages, hasH1)
	const thin = countWhere(pages, isThin)
	const https = countWhere(pages, p => (p.url || '').startsWith('https://'))

	const titles = new Map<string, number>()
	const descs = new Map<string, number>()
	let wordSum = 0
	let respCount = 0
	let respSum = 0
	let heavy = 0
	let slow = 0
	for (const p of pages) {
		if (p.title) titles.set(p.title, (titles.get(p.title) ?? 0) + 1)
		if (p.metaDesc) descs.set(p.metaDesc, (descs.get(p.metaDesc) ?? 0) + 1)
		wordSum += p.wordCount ?? 0
		if (p.loadTime) { respSum += p.loadTime; respCount++ }
		if ((p.transferredBytes ?? 0) > 1024 * 1024 * 2) heavy++
		if ((p.loadTime ?? 0) > 2500) slow++
	}
	const dupTitles = Array.from(titles.values()).filter(v => v > 1).reduce((s, v) => s + v, 0)
	const dupDescs  = Array.from(descs.values() ).filter(v => v > 1).reduce((s, v) => s + v, 0)
	const avgWords = n ? Math.round(wordSum / n) : 0
	const avgResp = respCount ? Math.round(respSum / respCount) : null

	// 5-axis radar
	const radar: WqaStats['radar'] = [
		{ axis: 'Content',  value: score100([
			{ weight: 1, value: pct(withTitle, n) },
			{ weight: 1, value: pct(withDesc, n) },
			{ weight: 1, value: pct(withH1, n) },
			{ weight: 1, value: 100 - pct(thin, n) },
		]) },
		{ axis: 'SEO',      value: score100([
			{ weight: 2, value: pct(indexable, n) },
			{ weight: 1, value: 100 - pct(dupTitles, n) },
			{ weight: 1, value: 100 - pct(dupDescs, n) },
		]) },
		{ axis: 'Authority', value: 50 }, // requires backlinks integration; honest neutral
		{ axis: 'UX',        value: avgResp == null ? 50 : Math.max(0, Math.min(100, 100 - (avgResp / 30))) },
		{ axis: 'Trust',     value: pct(https, n) },
	]
	const overallScore = Math.round(radar.reduce((s, r) => s + r.value, 0) / radar.length)

	const heroChips: WqaStats['heroChips'] = [
		{ label: 'Indexable',  value: `${pct(indexable, n)}%`, tone: pct(indexable, n) >= 80 ? 'good' : 'warn' },
		{ label: 'HTTPS',      value: `${pct(https, n)}%`,    tone: pct(https, n) >= 95 ? 'good' : 'bad' },
		{ label: 'Avg words',  value: avgWords.toString(),     tone: avgWords > 600 ? 'good' : avgWords > 300 ? 'warn' : 'bad' },
	]
	const ws = (deps.wqaState || {}) as Record<string, any>
	if (ws.detectedCms)      heroChips.push({ label: 'CMS',      value: ws.detectedCms, tone: 'info' })
	if (ws.detectedLanguage) heroChips.push({ label: 'Language', value: ws.detectedLanguage, tone: 'info' })

	// Quick-fix actions: sorted by impact
	const actions: WqaStats['actions'] = [
		{ id: 'add-titles',     label: `Add titles to ${n - withTitle} pages`,            effort: 'low' as const,    impact: n - withTitle },
		{ id: 'add-desc',       label: `Add descriptions to ${n - withDesc} pages`,       effort: 'low' as const,    impact: n - withDesc },
		{ id: 'add-h1',         label: `Add H1 to ${n - withH1} pages`,                   effort: 'low' as const,    impact: n - withH1 },
		{ id: 'expand-thin',    label: `Expand ${thin} thin pages (<300 words)`,          effort: 'medium' as const, impact: thin },
		{ id: 'fix-dup-titles', label: `Resolve ${dupTitles} duplicate titles`,           effort: 'medium' as const, impact: dupTitles },
		{ id: 'fix-dup-desc',   label: `Resolve ${dupDescs} duplicate descriptions`,      effort: 'medium' as const, impact: dupDescs },
		{ id: 'speed-up',       label: `Speed up ${slow} slow pages (>2.5s)`,             effort: 'high' as const,   impact: slow },
		{ id: 'shrink-heavy',   label: `Shrink ${heavy} heavy pages (>2MB)`,              effort: 'medium' as const, impact: heavy },
	].filter(a => a.impact > 0)

	return {
		overallScore,
		radar,
		heroChips,
		actions: topN(actions, 8, a => a.impact),
		search: {
			indexable, nonIndexable: n - indexable,
			canonicalIssues: countWhere(pages, p => !!p.canonicalUrl && p.canonicalUrl !== p.url),
			sitemapMissing: countWhere(pages, p => p.inSitemap === false), sitemapTotal: n,
		},
		tech: { https, httpsTotal: n, avgResponseMs: avgResp, heavyPages: heavy, slowPages: slow },
		content: {
			withTitle, withDesc, withH1, thin,
			dupTitles, dupDescriptions: dupDescs, avgWords,
		},
	}
}

// ── Legacy Compatibility / Detailed UI Logic ─────────────────────────
import { WqaSiteStats, WqaActionGroup, scoreToGrade } from '../WebsiteQualityModeTypes'

export function computeWqaSiteStats(pages: any[], industry: any): WqaSiteStats {
	const n = pages.length;
	const indexed = countWhere(pages, p => p.isIndexed !== false);
	
	const categories: Record<string, number> = {};
	pages.forEach(p => {
		const cat = p.pageCategory || 'Other';
		categories[cat] = (categories[cat] || 0) + 1;
	});

	const stats: WqaSiteStats = {
		totalPages: n,
		indexedPages: indexed,
		sitemapPages: countWhere(pages, p => p.inSitemap === true),
		htmlPages: countWhere(pages, p => p.contentType?.includes('html')),
		totalImpressions: pages.reduce((s, p) => s + (p.gscImpressions || 0), 0),
		totalClicks: pages.reduce((s, p) => s + (p.gscClicks || 0), 0),
		totalSessions: pages.reduce((s, p) => s + (p.ga4Sessions || 0), 0),
		avgPosition: n ? pages.reduce((s, p) => s + (p.gscPosition || 0), 0) / n : 0,
		avgCtr: n ? (pages.reduce((s, p) => s + (p.gscCtr || 0), 0) / n) * 100 : 0,
		totalRevenue: pages.reduce((s, p) => s + (p.ga4Revenue || 0), 0),
		totalTransactions: pages.reduce((s, p) => s + (p.ga4Transactions || 0), 0),
		totalGoalCompletions: pages.reduce((s, p) => s + (p.ga4Conversions || 0), 0),
		totalPageviews: pages.reduce((s, p) => s + (p.ga4Views || 0), 0),
		totalSubscribers: pages.reduce((s, p) => s + (p.ga4Subscribers || 0), 0),
		duplicateRate: pct(countWhere(pages, p => !!p.isDuplicate), n),
		orphanRate: pct(countWhere(pages, p => (p.inlinks || 0) === 0), n),
		thinContentRate: pct(countWhere(pages, isThin), n),
		brokenRate: pct(countWhere(pages, p => (p.status || 0) >= 400), n),
		schemaCoverage: pct(countWhere(pages, p => (p.schemaTypes?.length || 0) > 0), n),
		sitemapCoverage: pct(countWhere(pages, p => p.inSitemap === true), n),
		avgHealthScore: 0, // computed below
		avgContentQuality: pct(countWhere(pages, p => (p.wordCount || 0) > 500), n),
		avgSpeedScore: pct(countWhere(pages, p => (p.loadTime || 0) < 1500), n),
		avgEeat: 50,
		radarContent: pct(countWhere(pages, p => !!p.title && !!p.metaDesc), n),
		radarSeo: pct(indexed, n),
		radarAuthority: 50,
		radarUx: pct(countWhere(pages, p => (p.loadTime || 0) < 2500), n),
		radarSearchPerf: pct(countWhere(pages, p => (p.gscPosition || 100) <= 20), n),
		radarTrust: pct(countWhere(pages, p => (p.url || '').startsWith('https')), n),
		highValuePages: countWhere(pages, p => (p.internalPageRank || 0) >= 8),
		mediumValuePages: countWhere(pages, p => (p.internalPageRank || 0) >= 5 && (p.internalPageRank || 0) < 8),
		lowValuePages: countWhere(pages, p => (p.internalPageRank || 0) > 0 && (p.internalPageRank || 0) < 5),
		zeroValuePages: countWhere(pages, p => (p.internalPageRank || 0) === 0),
		pagesWithTechAction: countWhere(pages, p => (p.status || 0) >= 400 || (p.loadTime || 0) > 3000),
		pagesWithContentAction: countWhere(pages, isThin),
		pagesNoAction: 0,
		totalEstimatedImpact: 0,
		pagesLosingTraffic: countWhere(pages, p => !!p.isLosingTraffic),
		pagesWithZeroImpressions: countWhere(pages, p => (p.gscImpressions || 0) === 0 && (p.isIndexed !== false)),
		orphanPagesWithValue: countWhere(pages, p => (p.inlinks || 0) === 0 && (p.gscImpressions || 0) > 50),
		cannibalizationCount: countWhere(pages, p => !!p.isCannibalized),
		pagesInStrikingDistance: countWhere(pages, p => (p.gscPosition || 0) >= 4 && (p.gscPosition || 0) <= 20),
		pagesGoodSpeed: countWhere(pages, p => (p.loadTime || 0) < 1000),
		pagesByCategory: categories,
		newsSitemapCoverage: 0,
		decayRiskCount: countWhere(pages, p => !!p.isLosingTraffic),
		industryStats: null
	};
	stats.avgHealthScore = (stats.radarContent + stats.radarSeo + stats.radarUx + stats.radarTrust) / 4;
	stats.pagesNoAction = n - (stats.pagesWithTechAction + stats.pagesWithContentAction);
	return stats;
}

export function computeWqaActionGroups(pages: any[]): WqaActionGroup[] {
	const groups: Record<string, WqaActionGroup> = {};
	const add = (action: string, category: 'technical' | 'content' | 'industry', p: any, impact: number, effort: 'low'|'medium'|'high', reason: string) => {
		if (!groups[action]) {
			groups[action] = { action, category, pageCount: 0, totalEstimatedImpact: 0, avgPriority: 2, effort, reason, pages: [] };
		}
		groups[action].pageCount++;
		groups[action].totalEstimatedImpact += impact;
		if (groups[action].pages.length < 5) {
			groups[action].pages.push({
				url: p.url, pagePath: p.url, pageCategory: p.pageCategory || 'Other',
				impressions: p.gscImpressions || 0, clicks: p.gscClicks || 0, sessions: p.ga4Sessions || 0,
				position: p.gscPosition || 0, ctr: p.gscCtr || 0, estimatedImpact: impact
			});
		}
	};

	pages.forEach(p => {
		if ((p.status || 0) >= 400) add('Fix broken pages', 'technical', p, 10, 'low', 'Returning error status');
		if (isThin(p)) add('Expand thin content', 'content', p, 5, 'medium', 'Less than 300 words');
		if (!p.title) add('Add missing titles', 'content', p, 8, 'low', 'Empty title tag');
		if ((p.loadTime || 0) > 2500) add('Improve page speed', 'technical', p, 12, 'high', 'Load time > 2.5s');
	});

	return Object.values(groups);
}

export function deriveWqaScore(stats: WqaSiteStats) {
	const score = Math.round(stats.avgHealthScore);
	return { score, grade: scoreToGrade(score) };
}

export function transformActionsToGroups(actions: any[]): WqaActionGroup[] {
	return actions.map(a => ({
		action: a.label, category: 'technical', pageCount: a.impact, totalEstimatedImpact: a.impact * 10,
		avgPriority: 2, effort: a.effort, reason: 'High impact fix', pages: []
	}));
}

export const wqaBundle: RsModeBundle<WqaStats> = {
	mode: 'wqa',
	accent: 'violet',
	defaultTabId: 'wqa_overview',
	tabs: [
		{ id: 'wqa_overview', label: 'Overview', Component: WqaOverviewTab },
		{ id: 'wqa_actions',  label: 'Actions',  Component: WqaActionsTab  },
		{ id: 'wqa_search',   label: 'Search',   Component: WqaSearchTab   },
		{ id: 'wqa_tech',     label: 'Tech',     Component: WqaTechTab     },
		{ id: 'wqa_content',  label: 'Content',  Component: WqaContentTab  },
	],
	computeStats: computeWqaStats,
}
