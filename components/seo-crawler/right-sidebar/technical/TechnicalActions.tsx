import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function TechnicalActions() {
  const actions = useActionEngine('tech').slice(0, 8)
  if (!actions.length) return <EmptyState title="Technical health is good" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Technical Fixes" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
