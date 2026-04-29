import { describe, it, expect } from 'vitest'
import { computeUxStats } from '../uxConversion'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeUxStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeUxStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.vitals.total).toBe(0)
	})
	it('detects good CWV', () => {
		const pages = [
			makePage({ lcpMs: 1000, cls: 0.05, inpMs: 100 }),
		]
		const out = computeUxStats({ ...empty, pages } as any)
		expect(out.vitals.lcpGood).toBe(1)
	})
})
