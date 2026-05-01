import { FullAuditOverview }      from './FullAuditOverview'
import { FullAuditIssues }        from './FullAuditIssues'
import { FullAuditOpportunities } from './FullAuditOpportunities'
import { FullAuditSearch }        from './FullAuditSearch'
import { FullAuditTraffic }       from './FullAuditTraffic'
import { FullAuditTech }          from './FullAuditTech'
import { FullAuditLinks }         from './FullAuditLinks'
import { FullAuditAi }            from './FullAuditAi'
import { FullAuditActions }       from './FullAuditActions'
import { FullAuditHistory }       from './FullAuditHistory'
import type { RsTabDescriptor } from '../registry'

export const fullAuditTabs: RsTabDescriptor[] = [
  { id: 'overview',     label: 'Overview',     Component: FullAuditOverview },
  { id: 'issues',       label: 'Issues',       Component: FullAuditIssues,
    badge: ({ pages }) => pages.filter(p => p.statusCode >= 400).length || undefined },
  { id: 'opportunities',label: 'Opportunities',Component: FullAuditOpportunities },
  { id: 'search',       label: 'Search',       Component: FullAuditSearch },
  { id: 'traffic',      label: 'Traffic',      Component: FullAuditTraffic },
  { id: 'tech',         label: 'Tech',         Component: FullAuditTech },
  { id: 'links',        label: 'Links',        Component: FullAuditLinks },
  { id: 'ai',           label: 'AI',           Component: FullAuditAi },
  { id: 'actions',      label: 'Actions',      Component: FullAuditActions,
    badge: ({ pages }) => pages.filter(p => p.recommendedAction && p.recommendedAction !== 'Monitor').length || undefined },
  { id: 'history',      label: 'History',      Component: FullAuditHistory },
]
