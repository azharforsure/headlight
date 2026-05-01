import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function ContentActions() {
  const actions = useActionEngine('content').slice(0, 8)
  if (!actions.length) return <EmptyState title="Content looks strong" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Content Opportunities" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
