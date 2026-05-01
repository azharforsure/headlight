import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function WqaActions() {
  const actions = useActionEngine().slice(0, 8)
  if (!actions.length) return <EmptyState title="No quality fixes needed" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Quality Actions" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
