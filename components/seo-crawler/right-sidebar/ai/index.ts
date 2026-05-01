import { AiOverview }     from './AiOverview'
import { AiCrawlability } from './AiCrawlability'
import { AiCitations }    from './AiCitations'
import { AiEntities }     from './AiEntities'
import { AiSchema }       from './AiSchema'
import { AiActions }      from './AiActions'
import type { RsTabDescriptor } from '../registry'

export const aiTabs: RsTabDescriptor[] = [
  { id: 'overview',     label: 'Overview',      Component: AiOverview },
  { id: 'crawlability', label: 'Crawlability',  Component: AiCrawlability },
  { id: 'citations',    label: 'Citations',     Component: AiCitations },
  { id: 'entities',     label: 'Entities',      Component: AiEntities },
  { id: 'schema',       label: 'AI Schema',     Component: AiSchema },
  { id: 'actions',      label: 'Actions',       Component: AiActions },
]
