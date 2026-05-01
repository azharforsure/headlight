import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function PaidActions() {
  const actions = useActionEngine('paid').slice(0, 8)
  if (!actions.length) return <EmptyState title="Campaigns are optimized" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Paid Opportunities" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
