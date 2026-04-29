import { countWhere, isIndexable, isHttpOk, pct, score100, isHeavy } from './_helpers'
import { TechOverviewTab, TechIndexingTab, TechSpeedTab, TechSecurityTab, TechCrawlTab } from '../../components/seo-crawler/right-sidebar/modes/technical'
import type { RsDataDeps, RsModeBundle } from './types'

export interface TechnicalStats {
	overallScore: number
	indexing: {
		indexable: number; total: number;
		noindex: number; canonicalConflict: number;
		inSitemap: number; sitemapOnly: number; orphans: number
	}
	speed: { avgMs: number | null; slow: number; very: number; medMs: number | null }
	security: { https: number; mixedContent: number; weakHsts: number; httpRedirects: number }
	crawl: { ok: number; redirect: number; client: number; server: number; depthAvg: number | null; depthMax: number | null }
	sizes: { heavyPages: number; avgBytes: number | null }
}

export function computeTechnicalStats(deps: RsDataDeps): TechnicalStats {
	const pages = deps.pages
	const n = pages.length

	let ok = 0, redir = 0, c4 = 0, c5 = 0
	let idx = 0, noidx = 0, canonConf = 0, inSm = 0, smOnly = 0, orphans = 0
	let https = 0, mixed = 0, weakHsts = 0, httpRedirects = 0
	let respSum = 0, respCount = 0, slow = 0, very = 0
	let bytesSum = 0, bytesCount = 0, heavy = 0
	let depthSum = 0, depthCount = 0, depthMax = 0
	const respValues: number[] = []

	for (const p of pages) {
		const sc = p.statusCode ?? 0
		if (sc >= 200 && sc < 300) ok++
		else if (sc >= 300 && sc < 400) redir++
		else if (sc >= 400 && sc < 500) c4++
		else if (sc >= 500) c5++

		if (isIndexable(p)) idx++
		if (p.metaRobots?.includes('noindex')) noidx++
		if (p.canonical && p.canonical !== p.url) canonConf++
		if (p.inSitemap) inSm++
		if (p.inSitemap && (p.crawlDepth ?? Infinity) === Infinity) smOnly++
		if ((p.inboundInternalLinks ?? 0) === 0 && (p.crawlDepth ?? 0) > 0) orphans++

		if ((p.url || '').startsWith('https://')) https++
		if (p['hasMixedContent']) mixed++
		if (p['hasHsts'] === false) weakHsts++
		if (sc >= 300 && sc < 400 && (p.url || '').startsWith('http://')) httpRedirects++

		if (p.loadTime) {
			respSum += p.loadTime; respCount++; respValues.push(p.loadTime)
			if (p.loadTime > 2500) slow++
			if (p.loadTime > 5000) very++
		}
		if (p.transferredBytes) { bytesSum += p.transferredBytes; bytesCount++ }
		if (isHeavy(p)) heavy++
		if (p.crawlDepth != null) {
			depthSum += p.crawlDepth; depthCount++
			if (p.crawlDepth > depthMax) depthMax = p.crawlDepth
		}
	}
	respValues.sort((a, b) => a - b)
	const medMs = respValues.length ? respValues[Math.floor(respValues.length / 2)] : null

	const overallScore = score100([
		{ weight: 2, value: pct(ok, n) },
		{ weight: 2, value: pct(idx, n) },
		{ weight: 1, value: pct(https, n) },
		{ weight: 1, value: 100 - pct(heavy, n) },
	])

	return {
		overallScore,
		indexing: { indexable: idx, total: n, noindex: noidx, canonicalConflict: canonConf, inSitemap: inSm, sitemapOnly: smOnly, orphans },
		speed: { avgMs: respCount ? Math.round(respSum / respCount) : null, slow, very, medMs },
		security: { https, mixedContent: mixed, weakHsts, httpRedirects },
		crawl: { ok, redirect: redir, client: c4, server: c5, depthAvg: depthCount ? +(depthSum / depthCount).toFixed(1) : null, depthMax: depthCount ? depthMax : null },
		sizes: { heavyPages: heavy, avgBytes: bytesCount ? Math.round(bytesSum / bytesCount) : null },
	}
}

export const technicalBundle: RsModeBundle<TechnicalStats> = {
	mode: 'technical',
	accent: 'blue',
	defaultTabId: 'tech_overview',
	tabs: [
		{ id: 'tech_overview', label: 'Overview', Component: TechOverviewTab },
		{ id: 'tech_indexing', label: 'Indexing', Component: TechIndexingTab },
		{ id: 'tech_speed',    label: 'Speed',    Component: TechSpeedTab },
		{ id: 'tech_security', label: 'Security', Component: TechSecurityTab },
		{ id: 'tech_crawl',    label: 'Crawl',    Component: TechCrawlTab },
	],
	computeStats: computeTechnicalStats,
}
