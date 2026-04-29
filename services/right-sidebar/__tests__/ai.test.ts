import { describe, it, expect } from 'vitest'
import { computeAiStats } from '../ai'
import { makePage } from './_makePage'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeAiStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeAiStats(empty as any)
		expect(out.overallScore).toBeGreaterThanOrEqual(0)
		expect(out.schema.total).toBe(0)
	})
	it('detects AI-relevant schema', () => {
		const pages = [
			makePage({ schemaTypes: ['FAQPage', 'Organization'] }),
		]
		const out = computeAiStats({ ...empty, pages } as any)
		expect(out.schema.withFaq).toBe(1)
		expect(out.entities.withOrgSchema).toBe(1)
	})
})
