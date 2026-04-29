import { describe, it, expect } from 'vitest'
import { computeCompetitorsStats } from '../competitors'

const empty = { pages: [], industry: 'all', domain: '', filters: {}, integrationConnections: {}, wqaState: {}, wqaFilter: {} as any }

describe('computeCompetitorsStats', () => {
	it('handles empty input without throwing', () => {
		const out = computeCompetitorsStats(empty as any)
		expect(out.overallScore).toBe(null)
		expect(out.connections.serp).toBe(false)
	})
})
