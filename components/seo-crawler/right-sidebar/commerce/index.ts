import { CommerceOverview }  from './CommerceOverview'
import { CommerceInventory } from './CommerceInventory'
import { CommerceSchema }    from './CommerceSchema'
import { CommerceFeed }      from './CommerceFeed'
import { CommerceFunnel }    from './CommerceFunnel'
import { CommerceReviews }   from './CommerceReviews'
import { CommerceActions }   from './CommerceActions'
import type { RsTabDescriptor } from '../registry'

export const commerceTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',      Component: CommerceOverview },
  { id: 'inventory', label: 'Inventory (OOS)', Component: CommerceInventory },
  { id: 'schema',    label: 'Commerce Schema', Component: CommerceSchema },
  { id: 'feed',      label: 'GMC / Feeds',   Component: CommerceFeed },
  { id: 'funnel',    label: 'Checkout Funnel', Component: CommerceFunnel },
  { id: 'reviews',   label: 'Reviews & Social Proof', Component: CommerceReviews },
  { id: 'actions',   label: 'Actions',       Component: CommerceActions },
]
