import React from 'react'

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed border-[#222] bg-[#0a0a0a] px-3 py-6 text-center">
      {icon && <div className="mb-1.5 text-[#555]">{icon}</div>}
      <div className="text-[12px] font-semibold text-[#bbb]">{title}</div>
      {hint && <div className="mt-0.5 max-w-[260px] text-[10px] text-[#666]">{hint}</div>}
    </div>
  )
}

export function NotConnected({ source, onConnect }: { source: string; onConnect?: () => void }) {
  return (
    <div className="rounded border border-dashed border-[#222] bg-[#0a0a0a] p-3 text-center">
      <div className="text-[12px] font-semibold text-[#ccc]">{source} not connected</div>
      <div className="mt-1 text-[10px] text-[#666]">Connect to populate this tab.</div>
      {onConnect && (
        <button onClick={onConnect}
          className="mt-2 rounded bg-[#F5364E] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#df3248]">
          Connect {source}
        </button>
      )}
    </div>
  )
}
