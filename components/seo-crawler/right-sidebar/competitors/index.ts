import { CompetitorsOverview }  from './CompetitorsOverview'
import { CompetitorsGaps }      from './CompetitorsGaps'
import { CompetitorsWins }      from './CompetitorsWins'
import { CompetitorsLosses }    from './CompetitorsLosses'
import { CompetitorsBacklinks } from './CompetitorsBacklinks'
import { CompetitorsActions }   from './CompetitorsActions'
import type { RsTabDescriptor } from '../registry'

export const competitorsTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',      Component: CompetitorsOverview },
  { id: 'gaps',      label: 'Keyword Gaps',  Component: CompetitorsGaps },
  { id: 'wins',      label: 'Market Wins',   Component: CompetitorsWins },
  { id: 'losses',    label: 'Market Losses', Component: CompetitorsLosses },
  { id: 'backlinks', label: 'Backlink Gap',  Component: CompetitorsBacklinks },
  { id: 'actions',   label: 'Actions',       Component: CompetitorsActions },
]
