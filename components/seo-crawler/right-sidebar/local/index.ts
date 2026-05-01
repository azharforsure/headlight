import { LocalOverview } from './LocalOverview'
import { LocalNap }      from './LocalNap'
import { LocalGbp }      from './LocalGbp'
import { LocalReviews }  from './LocalReviews'
import { LocalPack }     from './LocalPack'
import { LocalActions }  from './LocalActions'
import type { RsTabDescriptor } from '../registry'

export const localTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview',      Component: LocalOverview },
  { id: 'nap',      label: 'NAP Consistency', Component: LocalNap },
  { id: 'gbp',      label: 'GBP Health',    Component: LocalGbp },
  { id: 'reviews',  label: 'Local Reviews', Component: LocalReviews },
  { id: 'pack',     label: 'Local Pack',    Component: LocalPack },
  { id: 'actions',  label: 'Actions',       Component: LocalActions },
]
