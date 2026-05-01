import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function CompetitorsActions() {
  const actions = useActionEngine('competitors').slice(0, 8)
  if (!actions.length) return <EmptyState title="No competitive threats" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Competitor Strategy" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
