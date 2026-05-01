import { UxOverview }  from './UxOverview'
import { UxFriction }  from './UxFriction'
import { UxFunnels }   from './UxFunnels'
import { UxForms }     from './UxForms'
import { UxCwv }       from './UxCwv'
import { UxTests }     from './UxTests'
import { UxActions }   from './UxActions'
import type { RsTabDescriptor } from '../registry'

export const uxTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: UxOverview },
  { id: 'friction', label: 'Friction', Component: UxFriction },
  { id: 'funnels',  label: 'Funnels',  Component: UxFunnels },
  { id: 'forms',    label: 'Forms',    Component: UxForms },
  { id: 'cwv',      label: 'Performance (CWV)', Component: UxCwv },
  { id: 'tests',    label: 'Tests & Experiments', Component: UxTests },
  { id: 'actions',  label: 'Actions',  Component: UxActions },
]
