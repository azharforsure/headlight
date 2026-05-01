import React from 'react'

export function EmptyState({
    title, hint, action,
}: { title: string; hint?: string; action?: React.ReactNode }) {
    return (
        <div className="rounded-md border border-dashed border-[#222] bg-[#0a0a0a] p-4 text-center">
            <div className="text-[12px] text-[#bbb] font-medium">{title}</div>
            {hint && <div className="text-[11px] text-[#666] mt-1">{hint}</div>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}
