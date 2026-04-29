import { describe, it, expect } from 'vitest'
import { computeContentStats } from '../content'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeContentStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeContentStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.coverage.total).toBe(0)
	})
	it('detects duplicate titles', () => {
		const pages = [
			makePage({ title: 'Dup' }),
			makePage({ title: 'Dup', url: 'https://example.com/2' }),
		]
		const out = computeContentStats({ ...empty, pages } as any)
		expect(out.dup.titles).toBe(2)
	})
})
