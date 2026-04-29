import type { ComponentType } from 'react'
import type { CrawledPage } from '../CrawlDatabase'
import type { Mode } from '../../packages/types/src/index'
import type { IndustryFilter } from '../CheckRegistry'
import type { WqaFilterState } from '../WqaFilterEngine'
import type { CrawlerIntegrationConnection } from '../CrawlerIntegrationsService'

export type RsAccent =
	| 'slate' | 'violet' | 'blue' | 'amber' | 'teal'
	| 'rose'  | 'cyan'   | 'green' | 'indigo' | 'fuchsia'
	| 'red'   | 'orange'

export interface RsDataDeps {
	pages: ReadonlyArray<CrawledPage>
	industry: IndustryFilter
	domain: string
	filters: Record<string, unknown>
	integrationConnections: Partial<Record<string, CrawlerIntegrationConnection>>
	wqaState: {
		detectedIndustry?: string | null
		detectedLanguage?: string | null
		detectedCms?: string | null
		isMultiLanguage?: boolean
		industryOverride?: string | null
	}
	wqaFilter: WqaFilterState
}

export interface RsTabProps<TStats = unknown> {
	deps: RsDataDeps
	stats: TStats
}

export interface RsTab<TStats = unknown> {
	id: string                               // e.g. 'wqa_overview'
	label: string                            // e.g. 'Overview'
	Component: ComponentType<RsTabProps<TStats>>
}

export interface RsModeBundle<TStats = unknown> {
	mode: Mode
	accent: RsAccent
	defaultTabId: string
	tabs: ReadonlyArray<RsTab<TStats>>
	computeStats: (deps: RsDataDeps) => TStats
}

// Helper: ensure every tab id starts with `${mode}_`
export type RsTabId<M extends string, S extends string> = `${M}_${S}`
