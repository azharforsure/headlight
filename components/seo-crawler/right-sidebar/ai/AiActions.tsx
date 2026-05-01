import React from 'react'
import { useActionEngine } from '../_hooks/useActionEngine'
import { Card, Section, ActionRow, EmptyState } from '../_shared'

export function AiActions() {
  const actions = useActionEngine('ai').slice(0, 8)
  if (!actions.length) return <EmptyState title="AI readiness is high" />
  return (
    <div className="space-y-3 p-3">
      <Card><Section title="AI Optimizations" dense>
        {actions.map(a => <ActionRow key={a.id} action={a} />)}
      </Section></Card>
    </div>
  )
}
