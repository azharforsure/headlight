import { describe, it, expect } from 'vitest'
import { computeFaStats } from '../fullAudit'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeFaStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeFaStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.totals.pages).toBe(0)
	})
	it('computes scores based on page quality', () => {
		const pages = [
			makePage({ title: 'A', metaDescription: 'B', h1s: ['C'] }),
			makePage({ title: '', metaDescription: '', h1s: [] }),
		]
		const out = computeFaStats({ ...empty, pages } as any)
		expect(out.totals.pages).toBe(2)
		expect(out.contentScore).toBeLessThan(100)
		expect(out.issuesByCategory.length).toBeGreaterThan(0)
	})
})
