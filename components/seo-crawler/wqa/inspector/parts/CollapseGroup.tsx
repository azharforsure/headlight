import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CollapseGroup({
  title, defaultOpen = true, right, children,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#1e1e1e] rounded mb-3 overflow-hidden bg-[#0a0a0a]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={12} className="text-[#666]" /> : <ChevronRight size={12} className="text-[#666]" />}
          <span className="text-[11px] font-black uppercase tracking-widest text-[#888]">{title}</span>
        </div>
        {right}
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}
