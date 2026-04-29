import { describe, it, expect } from 'vitest'
import { computeTechnicalStats } from '../technical'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeTechnicalStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeTechnicalStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.indexing.total).toBe(0)
	})
	it('detects https coverage', () => {
		const pages = [
			makePage({ url: 'https://example.com/' }),
			makePage({ url: 'http://example.com/' }),
		]
		const out = computeTechnicalStats({ ...empty, pages } as any)
		expect(out.security.https).toBe(1)
	})
})
