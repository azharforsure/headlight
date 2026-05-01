import { SocialOverview } from './SocialOverview'
import { SocialMentions } from './SocialMentions'
import { SocialEngage }   from './SocialEngage'
import { SocialTraffic }  from './SocialTraffic'
import { SocialMeta }     from './SocialMeta'
import { SocialActions }   from './SocialActions'
import type { RsTabDescriptor } from '../registry'

export const socialTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: SocialOverview },
  { id: 'mentions', label: 'Brand Mentions', Component: SocialMentions },
  { id: 'engage',   label: 'Social Engagement', Component: SocialEngage },
  { id: 'traffic',  label: 'Social Traffic', Component: SocialTraffic },
  { id: 'meta',     label: 'Open Graph / Meta', Component: SocialMeta },
  { id: 'actions',  label: 'Actions', Component: SocialActions },
]
