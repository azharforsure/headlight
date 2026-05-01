import React from 'react'
import { EmptyState } from './empty'

export function ComingSoon({ mode }: { mode: string }) {
  return (
    <div className="p-4">
      <EmptyState 
        title={`${mode} Insights Coming Soon`} 
        hint="We are still building out the detailed tabs for this mode. Stay tuned!" 
      />
    </div>
  )
}
