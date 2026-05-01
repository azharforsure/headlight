import React from 'react'

export function Skeleton({
  rows = 3, h = 14, className = '',
}: { rows?: number; h?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-sm bg-[#0d0d0d] border border-[#1a1a1a] animate-pulse" style={{ height: h }}  />
      ))}
    </div>
  )
}
