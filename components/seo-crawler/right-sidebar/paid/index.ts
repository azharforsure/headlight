import { PaidOverview }      from './PaidOverview'
import { PaidSpend }         from './PaidSpend'
import { PaidQualityScore }  from './PaidQualityScore'
import { PaidAuction }       from './PaidAuction'
import { PaidLandingPages }  from './PaidLandingPages'
import { PaidActions }       from './PaidActions'
import type { RsTabDescriptor } from '../registry'

export const paidTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',     Component: PaidOverview },
  { id: 'spend',     label: 'Spend',        Component: PaidSpend },
  { id: 'qs',        label: 'Quality',      Component: PaidQualityScore,
    badge: ({ site }) => {
      const camps = (site as any)?.paidCampaigns || []
      return camps.filter((c: any) => Number(c.qsAvg) > 0 && Number(c.qsAvg) < 7).length || undefined
    }},
  { id: 'auction',   label: 'Auction',      Component: PaidAuction },
  { id: 'lps',       label: 'Landing pages',Component: PaidLandingPages,
    badge: ({ pages }) => pages.filter(p => p.isPaidLandingPage && Number(p.lcp) > 4000).length || undefined },
  { id: 'actions',   label: 'Actions',      Component: PaidActions },
]
