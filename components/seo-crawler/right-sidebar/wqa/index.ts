import { WqaOverview } from './WqaOverview'
import { WqaActions } from './WqaActions'
import { WqaSearch } from './WqaSearch'
import { WqaContent } from './WqaContent'
import { WqaTech } from './WqaTech'
import type { RsTabDescriptor } from '../registry'
import {
	selectActionsByPriority, selectWordsDistribution, selectStructural,
} from './_selectors'

export const wqaTabs: RsTabDescriptor[] = [
	{ id: 'overview', label: 'Overview', Component: WqaOverview },
	{
		id: 'actions',
		label: 'Actions',
		Component: WqaActions,
		badge: ({ pages }) => {
			const p = selectActionsByPriority(pages)
			return p.high || undefined
		},
	},
	{ id: 'search', label: 'Search', Component: WqaSearch },
	{
		id: 'content',
		label: 'Content',
		Component: WqaContent,
		badge: ({ pages }) => {
			const w = selectWordsDistribution(pages)
			const thin = w.find(b => b.id === 'thin')?.count ?? 0
			return thin || undefined
		},
	},
	{
		id: 'tech',
		label: 'Tech',
		Component: WqaTech,
		badge: ({ pages }) => {
			const s = selectStructural(pages)
			const risks = s.orphans + s.deep + s.redirectChains + s.mixedContent
			return risks || undefined
		},
	},
]
