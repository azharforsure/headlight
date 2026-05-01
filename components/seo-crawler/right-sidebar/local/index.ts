import { LocalOverview }   from './LocalOverview'
import { LocalNap }        from './LocalNap'
import { LocalGbp }        from './LocalGbp'
import { LocalReviews }    from './LocalReviews'
import { LocalLocalPack }  from './LocalLocalPack'
import { LocalActions }    from './LocalActions'
import type { RsTabDescriptor } from '../registry'

export const localTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',   Component: LocalOverview },
  { id: 'nap',       label: 'NAP',        Component: LocalNap,
    badge: ({ site }) => (site as any)?.napMismatchCount || undefined },
  { id: 'gbp',       label: 'GBP',        Component: LocalGbp,
    badge: ({ site }) => (site as any)?.gbpUnverifiedCount || undefined },
  { id: 'reviews',   label: 'Reviews',    Component: LocalReviews,
    badge: ({ site }) => (site as any)?.unrespondedNegativeCount || undefined },
  { id: 'localpack', label: 'Local pack', Component: LocalLocalPack },
  { id: 'actions',   label: 'Actions',    Component: LocalActions },
]
