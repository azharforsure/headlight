import { TechnicalOverview }      from './TechnicalOverview'
import { TechnicalCrawl }          from './TechnicalCrawl'
import { TechnicalIndexing }       from './TechnicalIndexing'
import { TechnicalRender }         from './TechnicalRender'
import { TechnicalPerformance }    from './TechnicalPerformance'
import { TechnicalSecurity}        from './TechnicalSecurity'
import { TechnicalAccessibility }  from './TechnicalAccessibility'
import { TechnicalActions }        from './TechnicalActions'
import type { RsTabDescriptor } from '../registry'

export const technicalTabs: RsTabDescriptor[] = [
  { id: 'overview',      label: 'Overview',      Component: TechnicalOverview },
  { id: 'crawl',         label: 'Crawl',         Component: TechnicalCrawl },
  { id: 'indexing',      label: 'Indexing',      Component: TechnicalIndexing },
  { id: 'render',        label: 'Render',        Component: TechnicalRender },
  { id: 'performance',   label: 'Performance',   Component: TechnicalPerformance },
  { id: 'security',      label: 'Security',      Component: TechnicalSecurity },
  { id: 'accessibility', label: 'Accessibility', Component: TechnicalAccessibility },
  { id: 'actions',       label: 'Actions',       Component: TechnicalActions },
]
