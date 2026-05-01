import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export function HelpHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}>
      <HelpCircle size={11} className="text-[#666] hover:text-[#aaa]" />
      {open && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 w-44 rounded-md border border-[#222] bg-[#0a0a0a] px-2 py-1 text-[10px] text-[#ccc] shadow-lg pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}
