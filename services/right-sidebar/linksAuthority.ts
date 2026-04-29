import { countWhere, pct, score100, topN } from './_helpers'
import { LinksOverviewTab, LinksInternalTab, LinksExternalTab, LinksAnchorsTab, LinksToxicTab } from '../../components/seo-crawler/right-sidebar/modes/linksAuthority'
import type { RsDataDeps, RsModeBundle } from './types'

export interface LinksStats {
	overallScore: number
	internal: {
		total: number; orphans: number; deepPages: number; brokenInternal: number;
		topHubs: { url: string; outgoing: number }[]
		topAuthorities: { url: string; incoming: number }[]
	}
	external: {
		total: number; nofollow: number; brokenExternal: number;
		topDomains: { domain: string; links: number }[]
	}
	anchors: { topAnchors: { text: string; count: number }[]; emptyAnchors: number; genericAnchors: number }
	toxic: { total: number | null; topDomains: { domain: string; refs: number }[] | null }
}

export function computeLinksStats(deps: RsDataDeps): LinksStats {
	const pages = deps.pages
	const n = pages.length

	let intTotal = 0, brokenInt = 0, extTotal = 0, nofollow = 0, brokenExt = 0
	let emptyAnchors = 0, genericAnchors = 0
	const hubs = new Map<string, number>()
	const auths = new Map<string, number>()
	const extDomains = new Map<string, number>()
	const anchors = new Map<string, number>()
	const genericSet = new Set(['click here', 'read more', 'here', 'this', 'link', 'more'])

	for (const p of pages) {
		const out = (p['outgoingLinks'] as any[]) ?? []
		let outInternalCount = 0
		for (const l of out) {
			if (!l) continue
			if (l.isInternal) {
				intTotal++; outInternalCount++
				if (l.statusCode && l.statusCode >= 400) brokenInt++
				auths.set(l.target, (auths.get(l.target) ?? 0) + 1)
			} else {
				extTotal++
				if (l.rel?.includes('nofollow')) nofollow++
				if (l.statusCode && l.statusCode >= 400) brokenExt++
				try { const d = new URL(l.target).hostname.replace(/^www\./, ''); extDomains.set(d, (extDomains.get(d) ?? 0) + 1) } catch {}
			}
			const text = (l.anchor ?? '').trim().toLowerCase()
			if (!text) emptyAnchors++
			else if (genericSet.has(text)) genericAnchors++
			else anchors.set(text, (anchors.get(text) ?? 0) + 1)
		}
		hubs.set(p.url, outInternalCount)
	}

	const orphans = countWhere(pages, p => (p.inlinks ?? 0) === 0)
	const deepPages = countWhere(pages, p => (p.crawlDepth ?? 0) > 4)

	const overallScore = score100([
		{ weight: 2, value: 100 - pct(orphans, n) },
		{ weight: 1, value: 100 - pct(brokenInt, Math.max(1, intTotal)) * 4 },
		{ weight: 1, value: 100 - pct(emptyAnchors, Math.max(1, intTotal + extTotal)) * 4 },
	])

	return {
		overallScore,
		internal: {
			total: intTotal, orphans, deepPages, brokenInternal: brokenInt,
			topHubs: topN(Array.from(hubs.entries()), 5, ([, v]) => v).map(([url, outgoing]) => ({ url, outgoing })),
			topAuthorities: topN(Array.from(auths.entries()), 5, ([, v]) => v).map(([url, incoming]) => ({ url, incoming })),
		},
		external: {
			total: extTotal, nofollow, brokenExternal: brokenExt,
			topDomains: topN(Array.from(extDomains.entries()), 6, ([, v]) => v).map(([domain, links]) => ({ domain, links })),
		},
		anchors: {
			topAnchors: topN(Array.from(anchors.entries()), 6, ([, v]) => v).map(([text, count]) => ({ text, count })),
			emptyAnchors, genericAnchors,
		},
		toxic: { total: null, topDomains: null }, // requires backlinks integration
	}
}

export const linksAuthorityBundle: RsModeBundle<LinksStats> = {
	mode: 'linksAuthority',
	accent: 'rose',
	defaultTabId: 'links_overview',
	tabs: [
		{ id: 'links_overview', label: 'Overview', Component: LinksOverviewTab },
		{ id: 'links_internal', label: 'Internal', Component: LinksInternalTab },
		{ id: 'links_external', label: 'External', Component: LinksExternalTab },
		{ id: 'links_anchors',  label: 'Anchors',  Component: LinksAnchorsTab  },
		{ id: 'links_toxic',    label: 'Toxic',    Component: LinksToxicTab    },
	],
	computeStats: computeLinksStats,
}
