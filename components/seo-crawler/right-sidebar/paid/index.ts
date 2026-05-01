import { PaidOverview }     from './PaidOverview'
import { PaidSpend }        from './PaidSpend'
import { PaidQualityScore } from './PaidQualityScore'
import { PaidAuction }      from './PaidAuction'
import { PaidLandingPages } from './PaidLandingPages'
import { PaidActions }      from './PaidActions'
import type { RsTabDescriptor } from '../registry'

export const paidTabs: RsTabDescriptor[] = [
  { id: 'overview',     label: 'Overview',      Component: PaidOverview },
  { id: 'spend',        label: 'Spend & Budget', Component: PaidSpend },
  { id: 'quality',      label: 'Quality Score',  Component: PaidQualityScore },
  { id: 'auction',      label: 'Auction Insights', Component: PaidAuction },
  { id: 'landingpages', label: 'Landing Pages',  Component: PaidLandingPages },
  { id: 'actions',      label: 'Actions',       Component: PaidActions },
]
