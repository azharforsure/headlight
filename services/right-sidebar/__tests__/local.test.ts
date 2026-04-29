import { describe, it, expect } from 'vitest'
import { computeLocalStats } from '../local'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeLocalStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeLocalStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.nap.total).toBe(0)
	})
	it('detects local schema', () => {
		const pages = [
			makePage({ schemaTypes: ['LocalBusiness'], postalAddress: '123 Main St', phone: '555-1212' }),
		]
		const out = computeLocalStats({ ...empty, pages } as any)
		expect(out.nap.withLocalBusiness).toBe(1)
		expect(out.nap.withPhone).toBe(1)
	})
})
