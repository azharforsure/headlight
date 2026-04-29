import { describe, it, expect } from 'vitest'
import { computeWqaStats } from '../wqa'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeWqaStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeWqaStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.radar).toHaveLength(5)
		expect(out.actions).toEqual([])
	})
	it('detects missing titles as actions', () => {
		const pages = [
			makePage({ title: 'A' }),
			makePage({ url: 'https://example.com/x', title: '' }),
		]
		const out = computeWqaStats({ ...empty, pages } as any)
		expect(out.actions.find(a => a.id === 'add-titles')?.impact).toBe(1)
	})
})
