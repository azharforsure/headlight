import React from 'react'
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext'
import { getBundle } from '../../../services/right-sidebar/registry'
import { RsEmpty } from './RsEmpty'
import { RsError } from './RsError'
import type { RsDataDeps } from '../../../services/right-sidebar/types'

export function RsRouter() {
	const {
		mode, rsTab,
		pages, industry, domain, filters,
		integrationConnections, wqaState, wqaFilter,
	} = useSeoCrawler()

	const bundle = getBundle(mode)

	const deps: RsDataDeps = React.useMemo(() => ({
		pages, industry, domain,
		filters: filters ?? {},
		integrationConnections: integrationConnections ?? {},
		wqaState: wqaState ?? {},
		wqaFilter,
	}), [pages, industry, domain, filters, integrationConnections, wqaState, wqaFilter])

	const stats = React.useMemo(() => {
		if (!bundle) return null
		try { return bundle.computeStats(deps) }
		catch (e) { console.error('[RsRouter] computeStats threw', e); return undefined }
	}, [
		bundle, deps.pages, deps.industry, deps.domain,
		deps.filters, deps.integrationConnections, deps.wqaState, deps.wqaFilter,
	])

	if (!bundle) {
		return <RsEmpty title="This mode has no right-sidebar bundle yet" hint="It will appear here after the next landing." />
	}
	if (pages.length === 0) {
		return <RsEmpty title="No pages crawled" hint="Run a crawl to populate this panel." />
	}
	if (stats === undefined) {
		return <RsError message="Stats compute failed. Check the console for details." />
	}

	const activeId = rsTab[mode] ?? bundle.defaultTabId
	const tab = bundle.tabs.find(t => t.id === activeId) ?? bundle.tabs[0]
	if (!tab) return null

	const Tab = tab.Component
	return <Tab deps={deps} stats={stats} />
}
