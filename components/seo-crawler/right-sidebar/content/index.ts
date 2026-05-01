import { ContentOverview }    from './ContentOverview'
import { ContentTopics }      from './ContentTopics'
import { ContentQuality }     from './ContentQuality'
import { ContentDuplication } from './ContentDuplication'
import { ContentFreshness }   from './ContentFreshness'
import { ContentSchema }      from './ContentSchema'
import { ContentActions }     from './ContentActions'
import type { RsTabDescriptor } from '../registry'

export const contentTabs: RsTabDescriptor[] = [
  { id: 'overview',    label: 'Overview',    Component: ContentOverview },
  { id: 'topics',      label: 'Topics',      Component: ContentTopics },
  { id: 'quality',     label: 'Quality',     Component: ContentQuality },
  { id: 'duplication', label: 'Duplication', Component: ContentDuplication },
  { id: 'freshness',   label: 'Freshness',   Component: ContentFreshness },
  { id: 'schema',      label: 'Schema',      Component: ContentSchema },
  { id: 'actions',     label: 'Actions',     Component: ContentActions },
]
