import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function FullAuditActions() {
  const actions = useActionEngine().slice(0, 10)
  if (!actions.length) return <EmptyState title="No actions right now" hint="Run a crawl to see prioritized fixes." />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Recommended" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
