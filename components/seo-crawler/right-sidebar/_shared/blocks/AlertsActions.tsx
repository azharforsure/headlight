import React from 'react'
import { Card, Section, AlertRow, ActionRow } from '..'
import { useAlerts } from '../../_hooks/useAlerts'
import { useActions } from '../../_hooks/useActions'
import { useDrill } from '../drill'

export function TabbedAlertsBlock({ tabId, max = 5 }: { tabId: string; max?: number }) {
  const alerts = useAlerts(tabId)
  const drill = useDrill()
  if (!alerts.length) return null
  return (
    <Card><Section title="Alerts" dense>
      {alerts.slice(0, max).map(a => {
        const onClick = a.drill
          ? () => (a.drill?.type === 'page' ? drill.toPage({ url: a.drill.url }) : drill.toCategory(a.drill.macro, a.drill.cat))
          : undefined
        const alertObj = { id: a.id, tone: a.tone, title: a.title, count: a.count, detail: a.detail }
        return <AlertRow key={a.id} alert={alertObj} onClick={onClick} />
      })}
    </Section></Card>
  )
}

export function ActionsBlock({ tabId, max = 4 }: { tabId: string; max?: number }) {
  const actions = useActions(tabId)
  const drill = useDrill()
  if (!actions.length) return null
  return (
    <Card><Section title="Actions" dense>
      {actions.slice(0, max).map(a => {
        const onApprove = () => {}
        const onSnooze = () => {}
        const onClick = a.drill
          ? () => (a.drill?.type === 'page' ? drill.toPage({ url: a.drill.url }) : drill.toCategory(a.drill.macro, a.drill.cat))
          : undefined
        const actionObj = {
          id: a.id, title: a.title, reason: a.detail,
          forecast: a.forecastClicks ? `+${a.forecastClicks} clicks` : undefined,
        }
        return <ActionRow key={a.id} action={actionObj} onApprove={onApprove} onDismiss={onSnooze} />
      })}
    </Section></Card>
  )
}
