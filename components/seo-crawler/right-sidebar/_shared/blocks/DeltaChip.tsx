import React from 'react'

export function DeltaChip({ value }: { value: number }) {
  if (value === 0) return <span className="text-[10px] text-[#888]">·</span>
  const up = value > 0
  return (
    <span className={`text-[10px] font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toLocaleString()}
    </span>
  )
}
