import React from 'react'

export function SchemaCoverageBlock({ title = 'Schema coverage', coveragePct = 0, errors = 0, warnings = 0, types = [], onTypeClick }: {
  title?: string
  coveragePct?: number
  errors?: number
  warnings?: number
  types?: Array<{ type: string; count: number }>
  onTypeClick?: (t: string) => void
}) {
  const safeTypes = types || []
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider text-neutral-500">{title}</div>
        <div className="text-[10px] font-mono text-[#bbb]">
          {coveragePct.toFixed(0)}% cov · {errors} err · {warnings} warn
        </div>
      </div>
      {safeTypes.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {safeTypes.map(t => (
            <button
              key={t.type}
              onClick={() => onTypeClick?.(t.type)}
              className="text-[10px] font-mono px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:brightness-125 transition-all"
            >
              {t.type} · {t.count}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-[#666] italic">No schema types detected</div>
      )}
    </div>
  )
}
