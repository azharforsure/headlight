import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function CommerceActions() {
  const actions = useActionEngine('commerce').slice(0, 8)
  if (!actions.length) return <EmptyState title="Storefront is healthy" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Commerce Fixes" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
