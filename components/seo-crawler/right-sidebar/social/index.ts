import { SocialOverview }    from './SocialOverview'
import { SocialMentions }    from './SocialMentions'
import { SocialEngagement }  from './SocialEngagement'
import { SocialTraffic }     from './SocialTraffic'
import { SocialMetaTags }    from './SocialMetaTags'
import { SocialActions }     from './SocialActions'
import type { RsTabDescriptor } from '../registry'

export const socialTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',  Component: SocialOverview },
  { id: 'mentions',  label: 'Mentions',  Component: SocialMentions },
  { id: 'engage',    label: 'Engagement',Component: SocialEngagement },
  { id: 'traffic',   label: 'Traffic',   Component: SocialTraffic },
  { id: 'meta',      label: 'Meta tags', Component: SocialMetaTags,
    badge: ({ pages }) => pages.filter(p => p.isHtmlPage && (!p.ogImage || !p.twitterCard)).length || undefined },
  { id: 'actions',   label: 'Actions',   Component: SocialActions },
]
