// components/seo-crawler/right-sidebar/technical/index.ts
import type { RsTabDescriptor } from '../registry'
import { TechnicalOverview } from './TechnicalOverview'
import { TechnicalCrawl } from './TechnicalCrawl'
import { TechnicalIndexing } from './TechnicalIndexing'
import { TechnicalRender } from './TechnicalRender'
import { TechnicalPerformance } from './TechnicalPerformance'
import { TechnicalSecurity } from './TechnicalSecurity'
import { TechnicalAccessibility } from './TechnicalAccessibility'
import { TechnicalActions } from './TechnicalActions'

export const technicalTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',  Component: TechnicalOverview },
  { id: 'crawl',     label: 'Crawl',     Component: TechnicalCrawl },
  { id: 'indexing',  label: 'Indexing',  Component: TechnicalIndexing,
    badge: ({ pages }) => {
      const n = pages.filter((p: any) => p.inSitemap === false && p.statusCode === 200 && (p.isHtmlPage || String(p.contentType || '').includes('html'))).length
      return n || undefined
    },
  },
  { id: 'render',    label: 'Render',    Component: TechnicalRender },
  { id: 'perf',      label: 'Performance', Component: TechnicalPerformance },
  { id: 'security',  label: 'Security',  Component: TechnicalSecurity,
    badge: ({ pages }) => {
      const n = pages.filter((p: any) => p.sslValid === false || Number(p.exposedApiKeys || 0) > 0).length
      return n || undefined
    },
  },
  { id: 'a11y',      label: 'A11y',      Component: TechnicalAccessibility },
  { id: 'actions',   label: 'Actions',   Component: TechnicalActions,
    badge: ({ pages }) => {
      const n = pages.filter((p: any) => Number(p.statusCode || 0) >= 500 || p.exposedApiKeys > 0).length
      return n || undefined
    },
  },
]
