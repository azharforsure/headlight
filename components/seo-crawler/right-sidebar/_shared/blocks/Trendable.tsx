import React from 'react'

/** Renders children only when multi-crawl history exists. */
export function Trendable({ hasPrior, children }: { hasPrior: boolean; children: React.ReactNode }) {
  if (!hasPrior) return null
  return <>{children}</>
}
