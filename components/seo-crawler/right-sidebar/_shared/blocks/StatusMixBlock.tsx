import React from 'react'

export function StatusMixBlock({ title = 'Status mix', mix, onSegmentClick }: {
  title?: string
  mix: { ok: number; redirect: number; client: number; server: number; blocked: number }
  onSegmentClick?: (id: string) => void
}) {
  const total = Math.max(1, (mix?.ok || 0) + (mix?.redirect || 0) + (mix?.client || 0) + (mix?.server || 0) + (mix?.blocked || 0))
  const segs = [
    { id: '200 OK',           v: mix?.ok || 0,       cls: 'bg-emerald-500' },
    { id: '301 Redirect',     v: mix?.redirect || 0, cls: 'bg-blue-500' },
    { id: '404 Not Found',    v: mix?.client || 0,   cls: 'bg-amber-500' },
    { id: '500 Server Error', v: mix?.server || 0,   cls: 'bg-red-500' },
    { id: 'Blocked',          v: mix?.blocked || 0,  cls: 'bg-zinc-500' },
  ]
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="flex h-3 rounded overflow-hidden bg-[#141414]">
        {segs.map(s => s.v > 0 && (
          <button
            key={s.id}
            onClick={() => onSegmentClick?.(s.id)}
            title={`${s.id}: ${s.v.toLocaleString()}`}
            style={{ width: `${(s.v / total) * 100}%` }}
            className={`${s.cls} hover:brightness-125 transition-all`}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] font-mono text-[#bbb]">
        {segs.map(s => (
          <div key={s.id} className="text-center">
            <div className="text-[#888] truncate">{s.id.split(' ')[0]}</div>
            {s.v.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  )
}
