import { TechnicalOverview }      from './TechnicalOverview'
import { TechnicalCrawl }         from './TechnicalCrawl'
import { TechnicalIndexing }      from './TechnicalIndexing'
import { TechnicalRender }        from './TechnicalRender'
import { TechnicalPerformance }   from './TechnicalPerformance'
import { TechnicalSecurity }      from './TechnicalSecurity'
import { TechnicalAccessibility } from './TechnicalAccessibility'
import { TechnicalActions }       from './TechnicalActions'
import type { RsTabDescriptor }   from '../registry'

export const technicalTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',  Component: TechnicalOverview },
  { id: 'crawl',     label: 'Crawl',     Component: TechnicalCrawl },
  { id: 'indexing',  label: 'Indexing',  Component: TechnicalIndexing,
    badge: ({ pages }) => pages.filter(p => p.inSitemap === false && p.statusCode === 200 && p.isHtmlPage).length || undefined },
  { id: 'render',    label: 'Render',    Component: TechnicalRender },
  { id: 'perf',      label: 'Performance', Component: TechnicalPerformance },
  { id: 'security',  label: 'Security',  Component: TechnicalSecurity,
    badge: ({ pages }) => pages.filter(p => p.sslValid === false || Number(p.exposedApiKeys) > 0).length || undefined },
  { id: 'a11y',      label: 'A11y',      Component: TechnicalAccessibility },
  { id: 'actions',   label: 'Actions',   Component: TechnicalActions,
    badge: ({ pages }) => pages.filter(p => Number(p.statusCode) >= 500 || Number(p.exposedApiKeys) > 0).length || undefined },
]
