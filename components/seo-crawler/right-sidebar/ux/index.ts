import { UxOverview } from './UxOverview'
import { UxFriction } from './UxFriction'
import { UxFunnels }  from './UxFunnels'
import { UxForms }    from './UxForms'
import { UxCwv }      from './UxCwv'
import { UxTests }    from './UxTests'
import { UxActions }  from './UxActions'
import type { RsTabDescriptor } from '../registry'

export const uxTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: UxOverview },
  { id: 'friction', label: 'Friction', Component: UxFriction,
    badge: ({ pages }) => pages.reduce((a, p) => a + Number(p.rageClicks || 0), 0) || undefined },
  { id: 'funnels',  label: 'Funnels',  Component: UxFunnels },
  { id: 'forms',    label: 'Forms',    Component: UxForms },
  { id: 'cwv',      label: 'CWV',      Component: UxCwv },
  { id: 'tests',    label: 'Tests',    Component: UxTests },
  { id: 'actions',  label: 'Actions',  Component: UxActions },
]
