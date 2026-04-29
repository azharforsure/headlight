import { describe, it, expect } from 'vitest'
import { computeCommerceStats } from '../commerce'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeCommerceStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeCommerceStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.inventory.products).toBe(0)
	})
	it('detects product schema', () => {
		const pages = [
			makePage({ url: 'https://example.com/p/1', pageType: 'product', schemaTypes: ['Product'] }),
		]
		const out = computeCommerceStats({ ...empty, pages } as any)
		expect(out.schema.withProductSchema).toBe(1)
	})
})
