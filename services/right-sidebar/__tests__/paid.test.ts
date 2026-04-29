import { describe, it, expect } from 'vitest'
import { computePaidStats } from '../paid'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computePaidStats', () => {
	it('handles empty input without throwing', () => {
		const out = computePaidStats(empty as any)
		expect(out.overallScore).toBe(null)
		expect(out.landing.total).toBe(0)
	})
	it('identifies landing pages', () => {
		const pages = [
			makePage({ url: 'https://example.com/lp/1', isLandingPage: true }),
		]
		const out = computePaidStats({ ...empty, pages } as any)
		expect(out.landing.total).toBe(1)
	})
})
