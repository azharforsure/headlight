// components/seo-crawler/right-sidebar/full-audit/index.ts
import FullAuditOverview from './FullAuditOverview'
import FullAuditIssues from './FullAuditIssues'
import FullAuditScores from './FullAuditScores'
import FullAuditCrawlHealth from './FullAuditCrawlHealth'
import FullAuditIntegrations from './FullAuditIntegrations'
import { selectIssues } from './_selectors'

export const fullAuditTabs = [
  { id: 'overview',      label: 'Overview',     Component: FullAuditOverview },
  { id: 'issues',        label: 'Issues',       Component: FullAuditIssues,
    badge: ({ pages }: any) => {
      const { openTotal } = selectIssues(pages)
      return openTotal > 0 ? openTotal : undefined
    },
  },
  { id: 'scores',        label: 'Scores',       Component: FullAuditScores },
  { id: 'crawl_health',  label: 'Crawl health', Component: FullAuditCrawlHealth },
  { id: 'integrations',  label: 'Integrations', Component: FullAuditIntegrations },
] as const
