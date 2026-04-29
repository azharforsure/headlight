import { describe, it, expect } from 'vitest'
import { computeLinksStats } from '../linksAuthority'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeLinksStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeLinksStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.internal.total).toBe(0)
	})
	it('detects orphan pages', () => {
		const pages = [
			makePage({ url: 'https://example.com/orphan', inboundInternalLinks: 0 }),
		]
		const out = computeLinksStats({ ...empty, pages } as any)
		expect(out.internal.orphans).toBe(1)
	})
})
