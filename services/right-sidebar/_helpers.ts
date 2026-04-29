import type { CrawledPage } from '../CrawlDatabase'

export const safeAvg = (nums: number[]): number | null => {
	if (!nums.length) return null
	const clean = nums.filter(n => Number.isFinite(n))
	if (!clean.length) return null
	return clean.reduce((s, n) => s + n, 0) / clean.length
}

export const pct = (numerator: number, denominator: number): number => {
	if (!denominator) return 0
	return Math.round((numerator / denominator) * 1000) / 10
}

export const countWhere = <T>(arr: ReadonlyArray<T>, fn: (x: T) => boolean): number => {
	let n = 0
	for (const x of arr) if (fn(x)) n++
	return n
}

export const groupBy = <T, K extends string | number>(arr: ReadonlyArray<T>, key: (x: T) => K): Record<K, T[]> => {
	const out = {} as Record<K, T[]>
	for (const x of arr) {
		const k = key(x)
		;(out[k] ||= []).push(x)
	}
	return out
}

export const topN = <T>(arr: ReadonlyArray<T>, n: number, score: (x: T) => number): T[] =>
	[...arr].sort((a, b) => score(b) - score(a)).slice(0, n)

// 0..100 weighted score helper
export const score100 = (parts: { weight: number; value: number }[]): number => {
	const total = parts.reduce((s, p) => s + p.weight, 0) || 1
	const sum = parts.reduce((s, p) => s + p.weight * Math.max(0, Math.min(100, p.value)), 0)
	return Math.round(sum / total)
}

// Page predicates that all modes share
export const isHttpOk = (p: CrawledPage): boolean => (p.statusCode ?? 0) >= 200 && (p.statusCode ?? 0) < 300
export const isHttpError = (p: CrawledPage): boolean => (p.statusCode ?? 0) >= 400
export const isIndexable = (p: CrawledPage): boolean => !!p.indexable
export const hasTitle = (p: CrawledPage): boolean => !!p.title && p.title.trim().length > 0
export const hasMetaDescription = (p: CrawledPage): boolean => !!p.metaDesc && p.metaDesc.trim().length > 0
export const hasH1 = (p: CrawledPage): boolean => !!p.h1_1 && p.h1_1.trim().length > 0
export const wordCount = (p: CrawledPage): number => p.wordCount ?? 0
export const isThin = (p: CrawledPage): boolean => wordCount(p) < 300
export const isHeavy = (p: CrawledPage): boolean => (p.transferredBytes ?? 0) > 1024 * 1024 * 2
