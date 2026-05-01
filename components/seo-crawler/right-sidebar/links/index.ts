import { LinksOverview } from './LinksOverview'
import { LinksInternal } from './LinksInternal'
import { LinksExternal } from './LinksExternal'
import { LinksAnchors }  from './LinksAnchors'
import { LinksToxic }    from './LinksToxic'
import { LinksVelocity } from './LinksVelocity'
import { LinksActions }  from './LinksActions'
import type { RsTabDescriptor } from '../registry'

export const linksTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: LinksOverview },
  { id: 'internal', label: 'Internal', Component: LinksInternal,
    badge: ({ pages }) => pages.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0).length || undefined },
  { id: 'external', label: 'External', Component: LinksExternal },
  { id: 'anchors',  label: 'Anchors',  Component: LinksAnchors },
  { id: 'toxic',    label: 'Toxic',    Component: LinksToxic,
    badge: ({ pages }) => pages.filter(p => Number(p.toxicDomainCount) > 0).length || undefined },
  { id: 'velocity', label: 'Velocity', Component: LinksVelocity },
  { id: 'actions',  label: 'Actions',  Component: LinksActions },
]
