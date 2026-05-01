import type { RsTabDescriptor } from '../registry'
import { WqaOverview } from './WqaOverview'
import { WqaQuality } from './WqaQuality'
import { WqaActions } from './WqaActions'
import { WqaSearch } from './WqaSearch'
import { WqaContent } from './WqaContent'
import { WqaTech } from './WqaTech'
import { WqaHistory } from './WqaHistory'

export const wqaTabs: RsTabDescriptor[] = [
    { id: 'overview', label: 'Overview', Component: WqaOverview },
    { id: 'quality',  label: 'Quality',  Component: WqaQuality },
    {
        id: 'actions', label: 'Actions', Component: WqaActions,
        badge: ({ pages }) => {
            const high = pages.filter((p: any) => {
                if (p.statusCode >= 500) return true
                if (p.statusCode >= 400 && Number(p.gscClicks) > 0) return true
                if (p.indexable === false && Number(p.gscClicks) > 0) return true
                if (Number(p.qualityScore) < 30 && Number(p.gscClicks) > 100) return true
                return false
            }).length
            return high || undefined
        },
    },
    { id: 'search',  label: 'Search',  Component: WqaSearch },
    { id: 'content', label: 'Content', Component: WqaContent },
    { id: 'tech',    label: 'Tech',    Component: WqaTech },
    { id: 'history', label: 'History', Component: WqaHistory },
]
