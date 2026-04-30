import React from 'react'

export function SourceChip({ 
  sources, className 
}: { 
  sources: string[]
  className?: string 
}) {
  if (!sources || sources.length === 0) return null
  
  return (
    <div className={`flex flex-wrap gap-1 mt-3 pt-2 border-t border-white/5 ${className ?? ''}`}>
      {sources.map(s => (
        <span key={s} className="text-[9px] uppercase tracking-wider text-[#666] font-medium">
          ● {s}
        </span>
      ))}
    </div>
  )
}
