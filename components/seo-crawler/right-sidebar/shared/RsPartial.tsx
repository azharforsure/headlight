import React from 'react'
import { Chip } from './Chip'

export function RsPartial(props: {
  title: string
  reason: string
  cta?: { label: string; onClick: () => void }
}) {
  return (
    <div className="rounded-md border border-dashed border-[#1a1a1a] bg-[#0d0d0d] px-3 py-2 flex items-start gap-2">
      <Chip tone="warn">partial</Chip>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[#ccc] font-medium leading-tight">{props.title}</div>
        <div className="text-[10px] text-[#777] mt-0.5">{props.reason}</div>
        {props.cta && (
          <button
            onClick={props.cta.onClick}
            className="mt-1.5 text-[10px] text-[#F5364E] hover:text-white transition-colors"
          >
            {props.cta.label} →
          </button>
        )}
      </div>
    </div>
  )
}
