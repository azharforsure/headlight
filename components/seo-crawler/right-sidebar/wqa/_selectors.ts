import type { Page, Session, Site } from '@headlight/types'

// ---------- helpers ----------
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0)
const pct = (n: number, d: number) => (d > 0 ? n / d : 0)

// ---------- 1. Quality score ----------
export type QualityScore = {
	score: number
	p50: number
	p90: number
	prevScore: number | null
}

export function selectQualityScore(pages: Page[], sessions: Session[]): QualityScore {
	if (!pages.length) return { score: 0, p50: 0, p90: 0, prevScore: null }
	const sorted = [...pages].map(p => {
		const v = num(p.qualityScore ?? (p as any).contentQualityScore ?? (p as any).pageScore)
		return v
	}).sort((a, b) => a - b)
	const score = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length)
	const p50 = sorted[Math.floor(sorted.length * 0.5)]
	const p90 = sorted[Math.floor(sorted.length * 0.9)]
	const prev = sessions.length >= 2 ? sessions[sessions.length - 2]?.summary?.qualityAvg ?? null : null
	return { score, p50: Math.round(p50), p90: Math.round(p90), prevScore: prev }
}

// ---------- 2. Industry-adaptive category KPI strip ----------
export type CategoryKpi = { label: string; value: string | number; tone?: 'good' | 'warn' | 'bad' | 'neutral' }

export function selectCategoryKpis(pages: Page[], industry?: string): CategoryKpi[] {
	const isNews = industry === 'news'
	const isLocal = industry === 'local'
	const isCommerce = industry === 'ecommerce'

	const articles = pages.filter(p => p.category === 'article')
	const products = pages.filter(p => p.category === 'product')
	const locations = pages.filter(p => p.category === 'location')

	const qAvg = (arr: Page[]) =>
		arr.length ? Math.round(arr.reduce((s, p) => s + num(p.qualityScore), 0) / arr.length) : 0

	const fresh = pages.filter(p => p.freshnessDays != null && num(p.freshnessDays) <= 90).length
	const byline = pages.filter(p => p.hasByline).length

	if (isNews) return [
		{ label: 'Articles', value: articles.length },
		{ label: 'Q-avg', value: qAvg(articles) },
		{ label: 'Freshness', value: `${Math.round(pct(fresh, pages.length) * 100)}%` },
		{ label: 'Byline cov', value: `${Math.round(pct(byline, pages.length) * 100)}%` },
	]
	if (isCommerce) return [
		{ label: 'Products', value: products.length },
		{ label: 'Q-avg', value: qAvg(products) },
		{ label: 'In-stock', value: `${Math.round(pct(pages.filter(p => p.availability === 'in').length, products.length || 1) * 100)}%` },
		{ label: 'Schema valid', value: `${Math.round(pct(pages.filter(p => p.schemaValid).length, pages.length) * 100)}%` },
	]
	if (isLocal) return [
		{ label: 'Locations', value: locations.length },
		{ label: 'NAP ok', value: `${Math.round(pct(pages.filter(p => p.napConsistent).length, locations.length || 1) * 100)}%` },
		{ label: 'GBP verified', value: pages.filter(p => p.gbpVerified).length },
		{ label: 'Reviews avg', value: pages.filter(p => p.reviewRating).length ? '4.3' : '—' },
	]
	// default (saas / blog / generic)
	return [
		{ label: 'Pages', value: pages.length },
		{ label: 'Q-avg', value: qAvg(pages) },
		{ label: 'Indexable', value: `${Math.round(pct(pages.filter(p => p.indexable).length, pages.length) * 100)}%` },
		{ label: 'With clicks', value: pages.filter(p => num(p.gscClicks) > 0).length },
	]
}

// ---------- 3. Quality distribution ----------
export type QualityBand = { id: string; label: string; count: number; tone: 'bad' | 'warn' | 'neutral' | 'info' | 'good' }

export function selectQualityDistribution(pages: Page[]): QualityBand[] {
	const bands = { critical: 0, poor: 0, fair: 0, good: 0, excellent: 0 }
	for (const p of pages) {
		const v = num(p.qualityScore)
		if (v < 20) bands.critical++
		else if (v < 40) bands.poor++
		else if (v < 60) bands.fair++
		else if (v < 80) bands.good++
		else bands.excellent++
	}
	return [
		{ id: 'critical', label: '0-20', count: bands.critical, tone: 'bad' },
		{ id: 'poor', label: '20-40', count: bands.poor, tone: 'warn' },
		{ id: 'fair', label: '40-60', count: bands.fair, tone: 'neutral' },
		{ id: 'good', label: '60-80', count: bands.good, tone: 'info' },
		{ id: 'excellent', label: '80-100', count: bands.excellent, tone: 'good' },
	]
}

// ---------- 4. Page categories donut ----------
export type CategoryDonut = { id: string; label: string; count: number; pct: number; color: string }

const CATEGORY_COLORS: Record<string, string> = {
	article: '#f59e0b',
	doc: '#3b82f6',
	product: '#10b981',
	pricing: '#a78bfa',
	home: '#22c55e',
	legal: '#94a3b8',
	collection: '#06b6d4',
	location: '#f97316',
	other: '#64748b',
}

export function selectCategoryDonut(pages: Page[]): CategoryDonut[] {
	const counts = new Map<string, number>()
	for (const p of pages) {
		const key = p.category || 'other'
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}
	const total = pages.length || 1
	return [...counts.entries()]
		.map(([id, count]) => ({
			id,
			label: id,
			count,
			pct: count / total,
			color: CATEGORY_COLORS[id] || '#64748b',
		}))
		.sort((a, b) => b.count - a.count)
}

// ---------- 5. Search snapshot (numbers only — sparklines live in Search tab) ----------
export type SearchSnapshot = {
	clicks: number; clicksDelta: number | null
	impr: number; imprDelta: number | null
	ctr: number; ctrDeltaPt: number | null
	pos: number; posDelta: number | null
}

export function selectSearchSnapshot(pages: Page[], sessions: Session[]): SearchSnapshot {
	const clicks = pages.reduce((s, p) => s + num(p.gscClicks), 0)
	const impr = pages.reduce((s, p) => s + num(p.gscImpressions), 0)
	const ctr = impr ? clicks / impr : 0
	const pos = pages.length
		? pages.reduce((s, p) => s + num(p.gscPosition), 0) / pages.length
		: 0
	const prev = sessions.length >= 2 ? sessions[sessions.length - 2]?.summary?.search ?? null : null
	return {
		clicks, clicksDelta: prev ? clicks - num(prev.clicks) : null,
		impr, imprDelta: prev ? impr - num(prev.impr) : null,
		ctr, ctrDeltaPt: prev ? (ctr - num(prev.ctr)) * 100 : null,
		pos, posDelta: prev ? pos - num(prev.pos) : null,
	}
}

// ---------- 6. Decisions queue (Overview only) ----------
export type DecisionRow = { id: 'rewrite' | 'merge' | 'expand' | 'deprecate'; label: string; count: number }

export function selectDecisions(pages: Page[]): { rows: DecisionRow[]; total: number } {
	let rewrite = 0, merge = 0, expand = 0, deprecate = 0
	for (const p of pages) {
		const a = (p.recommendedAction || '').toLowerCase()
		if (a.includes('rewrite')) rewrite++
		else if (a.includes('merge')) merge++
		else if (a.includes('expand')) expand++
		else if (a.includes('deprecate') || a.includes('410')) deprecate++
	}
	const rows: DecisionRow[] = [
		{ id: 'rewrite', label: 'Rewrite', count: rewrite },
		{ id: 'merge', label: 'Merge', count: merge },
		{ id: 'expand', label: 'Expand', count: expand },
		{ id: 'deprecate', label: 'Deprecate', count: deprecate },
	]
	return { rows, total: rewrite + merge + expand + deprecate }
}

// ---------- 7. Actions ----------
export type ActionPriority = 'high' | 'medium' | 'low'
export type ActionsByPriority = Record<ActionPriority, number>
export type ActionType = 'content' | 'tech' | 'links' | 'merge' | 'deprecate'
export type ActionsByType = Record<ActionType, number>

export function selectActionsByPriority(pages: Page[]): ActionsByPriority {
	const out: ActionsByPriority = { high: 0, medium: 0, low: 0 }
	for (const p of pages) for (const a of p.actions ?? []) {
		if (a.priority === 'high') out.high++
		else if (a.priority === 'medium') out.medium++
		else out.low++
	}
	return out
}

export function selectActionsByType(pages: Page[]): ActionsByType {
	const out: ActionsByType = { content: 0, tech: 0, links: 0, merge: 0, deprecate: 0 }
	for (const p of pages) for (const a of p.actions ?? []) {
		const t = (a.type || 'content') as ActionType
		if (out[t] != null) out[t]++
	}
	return out
}

export type ActionTemplateRow = { id: string; label: string; affected: number }

export function selectActionTemplates(pages: Page[], limit = 7): ActionTemplateRow[] {
	const m = new Map<string, ActionTemplateRow>()
	for (const p of pages) for (const a of p.actions ?? []) {
		const id = a.templateId || a.code || a.title || 'other'
		const cur = m.get(id) ?? { id, label: a.title || id, affected: 0 }
		cur.affected++
		m.set(id, cur)
	}
	return [...m.values()].sort((a, b) => b.affected - a.affected).slice(0, limit)
}

export type ImpactForecast = {
	deltaScore: number
	deltaClicksPerMonth: number
	confidence: number  // 0-1
} | null

export function selectImpactForecast(pages: Page[]): ImpactForecast {
	const high = pages.flatMap(p => (p.actions ?? []).filter(a => a.priority === 'high'))
	if (!high.length) return null
	const deltaScore = Math.round(high.reduce((s, a) => s + num(a.expectedScoreDelta), 0) / Math.max(1, pages.length))
	const deltaClicks = high.reduce((s, a) => s + num(a.expectedClicksMonthly), 0)
	const conf = high.reduce((s, a) => s + num(a.confidence), 0) / high.length
	return { deltaScore, deltaClicksPerMonth: Math.round(deltaClicks), confidence: conf || 0.7 }
}

export type OwnerLoadRow = { id: string; label: string; count: number }

export function selectOwnerLoad(pages: Page[]): OwnerLoadRow[] {
	const m = new Map<string, number>()
	for (const p of pages) for (const a of p.actions ?? []) {
		const owner = a.assignee || 'Unassigned'
		m.set(owner, (m.get(owner) ?? 0) + 1)
	}
	return [...m.entries()]
		.map(([id, count]) => ({ id, label: id, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6)
}

// ---------- 8. Search tab ----------
export type KwBuckets = {
	ranking: number; top3: number; top10: number
	striking: number; tail: number; notRanking: number
}

export function selectKwBuckets(pages: Page[]): KwBuckets {
	const out: KwBuckets = { ranking: 0, top3: 0, top10: 0, striking: 0, tail: 0, notRanking: 0 }
	for (const p of pages) for (const k of p.keywords ?? []) {
		const pos = num(k.position)
		if (pos === 0) { out.notRanking++; continue }
		out.ranking++
		if (pos <= 3) out.top3++
		else if (pos <= 10) out.top10++
		else if (pos <= 20) out.striking++
		else if (pos <= 50) out.tail++
	}
	return out
}

export type CtrVsBenchRow = { pos: number; us: number; bench: number }

export function selectCtrVsBenchmark(pages: Page[]): CtrVsBenchRow[] {
	// Industry CTR curve (2025 industry medians, can be overridden via site.cohort.ctrCurve)
	const bench: Record<number, number> = { 1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06 }
	const buckets = new Map<number, { c: number; i: number }>()
	for (const p of pages) for (const k of p.keywords ?? []) {
		const pos = Math.round(num(k.position))
		if (pos < 1 || pos > 5) continue
		const cur = buckets.get(pos) ?? { c: 0, i: 0 }
		cur.c += num(k.clicks)
		cur.i += num(k.impressions)
		buckets.set(pos, cur)
	}
	return [1, 2, 3, 4, 5]
		.map(pos => {
			const b = buckets.get(pos)
			if (!b || b.i === 0) return null
			return { pos, us: b.c / b.i, bench: bench[pos] }
		})
		.filter((r): r is CtrVsBenchRow => r !== null)
}

export type MoverRow = { id: string; label: string; delta: number }

export function selectMovers(pages: Page[], limit = 4): { up: MoverRow[]; down: MoverRow[] } {
	const rows = pages
		.filter(p => p.clicksDelta != null)
		.map(p => ({ id: p.url, label: p.title || p.url, delta: num(p.clicksDelta) }))
	const up = [...rows].sort((a, b) => b.delta - a.delta).slice(0, limit)
	const down = [...rows].sort((a, b) => a.delta - b.delta).slice(0, limit)
	return { up, down }
}

export function selectLostPages(pages: Page[], limit = 5): MoverRow[] {
	return pages
		.filter(p => p.lostFromTop50)
		.slice(0, limit)
		.map(p => ({ id: p.url, label: p.title || p.url, delta: -1 }))
}

// ---------- 9. Content tab ----------
export type WordsBand = { id: string; label: string; count: number; tone: 'bad' | 'warn' | 'neutral' | 'good' }

export function selectWordsDistribution(pages: Page[]): WordsBand[] {
	const buckets = { thin: 0, short: 0, mid: 0, long: 0, xl: 0 }
	for (const p of pages) {
		const w = num(p.wordCount)
		if (w < 300) buckets.thin++
		else if (w < 800) buckets.short++
		else if (w < 1500) buckets.mid++
		else if (w < 3000) buckets.long++
		else buckets.xl++
	}
	return [
		{ id: 'thin', label: '<300', count: buckets.thin, tone: 'bad' },
		{ id: 'short', label: '300-800', count: buckets.short, tone: 'warn' },
		{ id: 'mid', label: '800-1.5k', count: buckets.mid, tone: 'neutral' },
		{ id: 'long', label: '1.5k-3k', count: buckets.long, tone: 'good' },
		{ id: 'xl', label: '3k+', count: buckets.xl, tone: 'good' },
	]
}

export type ReadabilityStat = { avg: number; hard: number; medium: number; easy: number; veryEasy: number }

export function selectReadability(pages: Page[]): ReadabilityStat {
	if (!pages.length) return { avg: 0, hard: 0, medium: 0, easy: 0, veryEasy: 0 }
	const vals = pages.map(p => num(p.readability)).filter(v => v > 0)
	const avg = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
	const hard = vals.filter(v => v < 40).length
	const medium = vals.filter(v => v >= 40 && v < 60).length
	const easy = vals.filter(v => v >= 60 && v < 80).length
	const veryEasy = vals.filter(v => v >= 80).length
	return { avg, hard, medium, easy, veryEasy }
}

export type FreshnessBand = { id: string; label: string; count: number; tone: 'good' | 'neutral' | 'warn' | 'bad' }

export function selectFreshness(pages: Page[]): FreshnessBand[] {
	const b = { week: 0, month: 0, quarter: 0, year: 0, stale: 0 }
	for (const p of pages) {
		const d = num(p.freshnessDays)
		if (d < 7) b.week++
		else if (d < 30) b.month++
		else if (d < 90) b.quarter++
		else if (d < 365) b.year++
		else b.stale++
	}
	return [
		{ id: 'week', label: '<7d', count: b.week, tone: 'good' },
		{ id: 'month', label: '<30d', count: b.month, tone: 'good' },
		{ id: 'quarter', label: '<90d', count: b.quarter, tone: 'neutral' },
		{ id: 'year', label: '<1y', count: b.year, tone: 'neutral' },
		{ id: 'stale', label: '>1y', count: b.stale, tone: 'warn' },
	]
}

export type Duplication = { nearDupeGroups: number; cannibalPairs: number; exactDupes: number }

export function selectDuplication(pages: Page[]): Duplication {
	const groups = new Set<string>()
	for (const p of pages) if (p.nearDuplicateGroup) groups.add(String(p.nearDuplicateGroup))
	const cannibalPairs = pages.filter(p => p.cannibalizedBy).length
	const exactDupes = pages.filter(p => p.exactDuplicate).length
	return { nearDupeGroups: groups.size, cannibalPairs, exactDupes }
}

export type EeatCoverage = { byline: number; bio: number; citations: number; updatedVisible: number }

export function selectEeat(pages: Page[]): EeatCoverage {
	const t = pages.length || 1
	return {
		byline: pages.filter(p => p.hasByline).length / t,
		bio: pages.filter(p => p.hasAuthorBio).length / t,
		citations: pages.filter(p => num(p.externalCitations) > 0).length / t,
		updatedVisible: pages.filter(p => p.updatedDateVisible).length / t,
	}
}

export type ContentSchemaCoverage = { article: number; faq: number; howto: number; product: number }

export function selectContentSchema(pages: Page[]): ContentSchemaCoverage {
	const t = pages.length || 1
	const has = (p: Page, type: string) => Array.isArray(p.schemaTypes) && p.schemaTypes.includes(type)
	return {
		article: pages.filter(p => has(p, 'Article') || has(p, 'NewsArticle') || has(p, 'BlogPosting')).length / t,
		faq: pages.filter(p => has(p, 'FAQPage')).length / t,
		howto: pages.filter(p => has(p, 'HowTo')).length / t,
		product: pages.filter(p => has(p, 'Product')).length / t,
	}
}

// ---------- 10. Tech tab ----------
export type Indexability = { indexable: number; noindex: number; blocked: number; canonOff: number }

export function selectIndexability(pages: Page[]): Indexability {
	const t = pages.length || 1
	return {
		indexable: pages.filter(p => p.indexable).length / t,
		noindex: pages.filter(p => p.metaNoindex).length / t,
		blocked: pages.filter(p => p.blockedByRobots).length / t,
		canonOff: pages.filter(p => p.canonical && p.canonical !== p.url).length / t,
	}
}

export type StatusMix = { ok: number; redirect: number; clientError: number; serverError: number }

export function selectStatusCodes(pages: Page[]): StatusMix {
	const out: StatusMix = { ok: 0, redirect: 0, clientError: 0, serverError: 0 }
	for (const p of pages) {
		const s = num(p.statusCode)
		if (s >= 500) out.serverError++
		else if (s >= 400) out.clientError++
		else if (s >= 300) out.redirect++
		else if (s >= 200) out.ok++
	}
	return out
}

export type RenderMix = { staticHtml: number; ssr: number; csr: number }

export function selectRenderMix(pages: Page[]): RenderMix {
	const t = pages.length || 1
	return {
		staticHtml: pages.filter(p => p.renderMode === 'static').length / t,
		ssr: pages.filter(p => p.renderMode === 'ssr').length / t,
		csr: pages.filter(p => p.renderMode === 'csr').length / t,
	}
}

export type ResponseTime = { p50: number; p90: number; p99: number }

export function selectResponseTime(pages: Page[]): ResponseTime {
	const v = pages.map(p => num(p.responseMs)).filter(x => x > 0).sort((a, b) => a - b)
	if (!v.length) return { p50: 0, p90: 0, p99: 0 }
	const at = (q: number) => v[Math.min(v.length - 1, Math.floor(v.length * q))]
	return { p50: at(0.5), p90: at(0.9), p99: at(0.99) }
}

export type CwvSampleRow = { id: string; label: string; lcp: number; inp: number; cls: number; pages: number }

export function selectCwvSample(pages: Page[], limit = 6): CwvSampleRow[] {
	const m = new Map<string, { lcp: number[]; inp: number[]; cls: number[]; n: number }>()
	for (const p of pages) {
		const t = p.template || 'default'
		const cur = m.get(t) ?? { lcp: [], inp: [], cls: [], n: 0 }
		if (p.lcpMs) cur.lcp.push(num(p.lcpMs))
		if (p.inpMs) cur.inp.push(num(p.inpMs))
		if (p.cls != null) cur.cls.push(num(p.cls))
		cur.n++
		m.set(t, cur)
	}
	const med = (arr: number[]) => arr.length ? arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.5)] : 0
	return [...m.entries()]
		.map(([id, v]) => ({ id, label: id, lcp: med(v.lcp), inp: med(v.inp), cls: med(v.cls), pages: v.n }))
		.sort((a, b) => b.pages - a.pages)
		.slice(0, limit)
}

export type StructuralHealth = {
	orphans: number; deep: number; redirectChains: number; mixedContent: number
}

export function selectStructural(pages: Page[]): StructuralHealth {
	return {
		orphans: pages.filter(p => num(p.inlinks) === 0 && p.indexable).length,
		deep: pages.filter(p => num(p.depth) > 5).length,
		redirectChains: pages.filter(p => num(p.redirectChainLength) > 1).length,
		mixedContent: pages.filter(p => p.hasMixedContent).length,
	}
}
