import { countWhere, hasTitle, hasMetaDescription, hasH1, isThin, pct, score100, topN } from './_helpers'
import { ContentOverviewTab, ContentTopicsTab, ContentQualityTab, ContentAuthorsTab, ContentActionsTab } from '../../components/seo-crawler/right-sidebar/modes/content'
import type { RsDataDeps, RsModeBundle } from './types'

export interface ContentStats {
	overallScore: number
	coverage: { withTitle: number; withDesc: number; withH1: number; total: number }
	quality: { thin: number; long: number; avgWords: number; avgReadability: number | null }
	topics: { name: string; pages: number }[]   // top 6
	authors: { name: string; pages: number; avgWords: number }[] | null  // null when no author data
	actions: { id: string; label: string; effort: 'low' | 'medium' | 'high'; impact: number }[]
	dup: { titles: number; descriptions: number }
	images: { withoutAlt: number; total: number }
}

export function computeContentStats(deps: RsDataDeps): ContentStats {
	const pages = deps.pages
	const n = pages.length

	const withTitle = countWhere(pages, hasTitle)
	const withDesc = countWhere(pages, hasMetaDescription)
	const withH1 = countWhere(pages, hasH1)
	const thin = countWhere(pages, isThin)
	const long = countWhere(pages, p => (p.wordCount ?? 0) >= 1500)
	let wordSum = 0, readSum = 0, readCount = 0
	let imgTotal = 0, imgNoAlt = 0
	const topicMap = new Map<string, number>()
	const authorMap = new Map<string, { pages: number; words: number }>()
	const titleMap = new Map<string, number>()
	const descMap = new Map<string, number>()

	for (const p of pages) {
		wordSum += p.wordCount ?? 0
		if (typeof p['readabilityScore'] === 'number') { readSum += p['readabilityScore']; readCount++ }
		if (p.title) titleMap.set(p.title, (titleMap.get(p.title) ?? 0) + 1)
		if (p.metaDesc) descMap.set(p.metaDesc, (descMap.get(p.metaDesc) ?? 0) + 1)
		if (Array.isArray(p['images'])) {
			imgTotal += p['images'].length
			imgNoAlt += p['images'].filter((i: any) => !i?.alt || i.alt.trim() === '').length
		}
		if (Array.isArray(p['topics'])) for (const t of p['topics']) topicMap.set(t, (topicMap.get(t) ?? 0) + 1)
		if (p['author']) {
			const auth = p['author']
			const e = authorMap.get(auth) ?? { pages: 0, words: 0 }
			e.pages++; e.words += p.wordCount ?? 0
			authorMap.set(auth, e)
		}
	}

	const dupTitles = Array.from(titleMap.values()).filter(v => v > 1).reduce((s, v) => s + v, 0)
	const dupDescs = Array.from(descMap.values()).filter(v => v > 1).reduce((s, v) => s + v, 0)
	const avgWords = n ? Math.round(wordSum / n) : 0
	const avgRead = readCount ? Math.round(readSum / readCount) : null

	const overallScore = score100([
		{ weight: 1, value: pct(withTitle, n) },
		{ weight: 1, value: pct(withDesc, n) },
		{ weight: 1, value: pct(withH1, n) },
		{ weight: 1, value: 100 - pct(thin, n) },
		{ weight: 1, value: 100 - pct(dupTitles, n) },
	])

	const topics = topN(Array.from(topicMap.entries()), 6, ([, v]) => v).map(([name, pages]) => ({ name, pages }))
	const authors = authorMap.size === 0 ? null :
		topN(Array.from(authorMap.entries()), 8, ([, v]) => v.pages)
			.map(([name, v]) => ({ name, pages: v.pages, avgWords: Math.round(v.words / v.pages) }))

	const actions: ContentStats['actions'] = [
		{ id: 'add-titles', label: `Add titles to ${n - withTitle} pages`, effort: 'low' as const, impact: n - withTitle },
		{ id: 'add-desc',   label: `Add descriptions to ${n - withDesc} pages`, effort: 'low' as const, impact: n - withDesc },
		{ id: 'add-h1',     label: `Add H1 to ${n - withH1} pages`, effort: 'low' as const, impact: n - withH1 },
		{ id: 'expand-thin',label: `Expand ${thin} thin pages`, effort: 'medium' as const, impact: thin },
		{ id: 'alt-text',   label: `Add alt text to ${imgNoAlt} images`, effort: 'low' as const, impact: imgNoAlt },
		{ id: 'dup-titles', label: `Resolve ${dupTitles} duplicate titles`, effort: 'medium' as const, impact: dupTitles },
	].filter(a => a.impact > 0)

	return {
		overallScore,
		coverage: { withTitle, withDesc, withH1, total: n },
		quality: { thin, long, avgWords, avgReadability: avgRead },
		topics,
		authors,
		actions: topN(actions, 6, a => a.impact),
		dup: { titles: dupTitles, descriptions: dupDescs },
		images: { withoutAlt: imgNoAlt, total: imgTotal },
	}
}

export const contentBundle: RsModeBundle<ContentStats> = {
	mode: 'content',
	accent: 'amber',
	defaultTabId: 'content_overview',
	tabs: [
		{ id: 'content_overview', label: 'Overview', Component: ContentOverviewTab },
		{ id: 'content_topics',   label: 'Topics',   Component: ContentTopicsTab },
		{ id: 'content_quality',  label: 'Quality',  Component: ContentQualityTab },
		{ id: 'content_authors',  label: 'Authors',  Component: ContentAuthorsTab },
		{ id: 'content_actions',  label: 'Actions',  Component: ContentActionsTab },
	],
	computeStats: computeContentStats,
}
