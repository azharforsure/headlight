import React from 'react'

export function NotConnected({ source, reason, onConnect }: {
  source: string
  reason: string
  onConnect?: () => void
}) {
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-4 text-center">
      <div className="text-[12px] text-white font-semibold">{source} not connected</div>
      <div className="text-[11px] text-[#888] mt-1">{reason}</div>
      <button
        onClick={onConnect}
        className="mt-3 px-3 py-1.5 text-[11px] font-bold bg-[#F5364E] text-white rounded hover:bg-[#df3248] transition-colors"
      >
        Connect {source}
      </button>
    </div>
  )
}
