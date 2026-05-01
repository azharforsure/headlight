import { CompetitorsOverview }  from './CompetitorsOverview'
import { CompetitorsGaps }      from './CompetitorsGaps'
import { CompetitorsWins }      from './CompetitorsWins'
import { CompetitorsLosses }    from './CompetitorsLosses'
import { CompetitorsBacklinks } from './CompetitorsBacklinks'
import { CompetitorsActions }   from './CompetitorsActions'
import type { RsTabDescriptor } from '../registry'

export const competitorsTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',  Component: CompetitorsOverview },
  { id: 'gaps',      label: 'Gaps',      Component: CompetitorsGaps,
    badge: ({ site }) => (site as any)?.gapKeywordsCount || undefined },
  { id: 'wins',      label: 'Wins',      Component: CompetitorsWins },
  { id: 'losses',    label: 'Losses',    Component: CompetitorsLosses,
    badge: ({ pages }) => pages.filter(p => Array.isArray(p.lostToCompetitors) && p.lostToCompetitors.length > 0).length || undefined },
  { id: 'backlinks', label: 'Backlinks', Component: CompetitorsBacklinks },
  { id: 'actions',   label: 'Actions',   Component: CompetitorsActions },
]
