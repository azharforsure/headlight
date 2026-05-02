import React from 'react'

export function CwvPassMatrixBlock({ title = 'Core Web Vitals pass rate', matrix, onCellClick }: {
  title?: string
  matrix: {
    mobile: { lcp: number; inp: number; cls: number }
    desktop: { lcp: number; inp: number; cls: number }
  }
  onCellClick?: (device: 'mobile' | 'desktop', metric: 'lcp' | 'inp' | 'cls') => void
}) {
  const cellCls = (v: number) =>
    v >= 75
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : v >= 50
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : 'border-red-500/30 bg-red-500/10 text-red-300'

  const Row = ({ device, row }: { device: 'mobile' | 'desktop'; row: { lcp: number; inp: number; cls: number } }) => (
    <div className="contents">
      <div className="text-[10px] uppercase tracking-widest text-[#888] self-center">{device}</div>
      {(['lcp', 'inp', 'cls'] as const).map(m => (
        <button
          key={m}
          onClick={() => onCellClick?.(device, m)}
          className={`rounded border px-2 py-2 hover:brightness-125 transition-all ${cellCls(row[m])}`}
        >
          <div className="text-[9px] uppercase tracking-widest">{m}</div>
          <div className="text-[14px] font-bold tabular-nums">{row[m]}%</div>
        </button>
      ))}
    </div>
  )

  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-1.5">
        <Row device="mobile" row={matrix.mobile} />
        <Row device="desktop" row={matrix.desktop} />
      </div>
    </div>
  )
}
