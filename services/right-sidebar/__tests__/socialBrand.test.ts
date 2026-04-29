import { describe, it, expect } from 'vitest'
import { computeSocialStats } from '../socialBrand'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeSocialStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeSocialStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.og.total).toBe(0)
	})
	it('detects OG tags', () => {
		const pages = [
			makePage({ ogTitle: 'OG Title' }),
		]
		const out = computeSocialStats({ ...empty, pages } as any)
		expect(out.og.withOgTitle).toBe(1)
	})
})
