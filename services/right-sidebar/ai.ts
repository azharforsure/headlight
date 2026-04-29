import type { RsDataDeps, RsModeBundle } from './types'
import { pct, score100, topN } from './_helpers'
import { AiOverviewTab, AiEntitiesTab, AiInsightsTab, AiSchemaTab, AiChatTab } from '../../components/seo-crawler/right-sidebar/modes/ai'

export interface AiStats {
	overallScore: number
	language: string | null
	sentiment: string | null
	readabilityScore: number | null
	insights: { count: number; items: string[] }
	schema: { covered: number; total: number; topTypes: { type: string; count: number }[] }
	entities: { total: number; top: { name: string; count: number }[] }
}

export function computeAiStats(deps: RsDataDeps): AiStats {
	const pages = deps.pages
	const n = pages.length
	let schemaCovered = 0
	let sentimentSum = 0, sentimentCount = 0
	let readSum = 0, readCount = 0
	const schemaTypes = new Map<string, number>()
	const entityMap = new Map<string, number>()
	const languages = new Map<string, number>()
	const sentiments = new Map<string, number>()

	for (const p of pages) {
		const st = (p['schemaTypes'] as string[]) ?? []
		if (st.length > 0) schemaCovered++
		for (const t of st) schemaTypes.set(t, (schemaTypes.get(t) ?? 0) + 1)

		const entities = (p['entities'] as any[]) ?? []
		for (const e of entities) {
			if (e.name) entityMap.set(e.name, (entityMap.get(e.name) ?? 0) + (e.count || 1))
		}

		if (p['language']) languages.set(p['language'], (languages.get(p['language']) ?? 0) + 1)
		if (p['sentiment']) sentiments.set(p['sentiment'], (sentiments.get(p['sentiment']) ?? 0) + 1)
		
		if (typeof p['readabilityScore'] === 'number') { readSum += p['readabilityScore']; readCount++ }
	}

	const topLang = topN(Array.from(languages.entries()), 1, ([, v]) => v)[0]?.[0] ?? null
	const topSent = topN(Array.from(sentiments.entries()), 1, ([, v]) => v)[0]?.[0] ?? null

	const overallScore = score100([
		{ weight: 2, value: pct(schemaCovered, n) },
		{ weight: 1, value: readCount ? Math.min(100, (readSum / readCount)) : 50 },
	])

	const insights: string[] = []
	if (pct(schemaCovered, n) < 50) insights.push('Low schema coverage reduces rich snippet potential.')
	if (topSent === 'negative') insights.push('Dominant negative sentiment detected across pages.')
	if (readCount && (readSum / readCount) < 40) insights.push('Low readability scores; content may be too complex.')

	return {
		overallScore,
		language: topLang,
		sentiment: topSent,
		readabilityScore: readCount ? Math.round(readSum / readCount) : null,
		insights: { count: insights.length, items: insights },
		schema: {
			covered: schemaCovered, total: n,
			topTypes: topN(Array.from(schemaTypes.entries()), 5, ([, v]) => v).map(([type, count]) => ({ type, count }))
		},
		entities: {
			total: entityMap.size,
			top: topN(Array.from(entityMap.entries()), 10, ([, v]) => v).map(([name, count]) => ({ name, count }))
		}
	}
}

export const aiBundle: RsModeBundle<AiStats> = {
	mode: 'ai',
	accent: 'purple',
	defaultTabId: 'ai_overview',
	tabs: [
		{ id: 'ai_overview', label: 'Overview', Component: AiOverviewTab },
		{ id: 'ai_insights', label: 'Insights', Component: AiInsightsTab },
		{ id: 'ai_entities', label: 'Entities', Component: AiEntitiesTab },
		{ id: 'ai_schema',   label: 'Schema',   Component: AiSchemaTab   },
		{ id: 'ai_chat',     label: 'Assistant', Component: AiChatTab    },
	],
	computeStats: computeAiStats,
}
