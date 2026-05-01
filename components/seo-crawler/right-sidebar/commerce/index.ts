import { CommerceOverview }  from './CommerceOverview'
import { CommerceInventory } from './CommerceInventory'
import { CommerceSchema }    from './CommerceSchema'
import { CommerceFeed }      from './CommerceFeed'
import { CommerceFunnel }    from './CommerceFunnel'
import { CommerceReviews }   from './CommerceReviews'
import { CommerceActions }   from './CommerceActions'
import type { RsTabDescriptor } from '../registry'

export const commerceTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',  Component: CommerceOverview },
  { id: 'inventory', label: 'Inventory', Component: CommerceInventory,
    badge: ({ pages }) => pages.filter(p => p.isProduct && p.availability === 'out_of_stock').length || undefined },
  { id: 'schema',    label: 'Schema',    Component: CommerceSchema,
    badge: ({ pages }) => pages.filter(p => p.isProduct && p.productSchemaValid === false).length || undefined },
  { id: 'feed',      label: 'Feed',      Component: CommerceFeed,
    badge: ({ pages }) => pages.filter(p => p.feedStatus === 'error').length || undefined },
  { id: 'funnel',    label: 'Funnel',    Component: CommerceFunnel },
  { id: 'reviews',   label: 'Reviews',   Component: CommerceReviews },
  { id: 'actions',   label: 'Actions',   Component: CommerceActions },
]
