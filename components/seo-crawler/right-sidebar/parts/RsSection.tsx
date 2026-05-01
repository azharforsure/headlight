import React from 'react'

export function RsSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">{title}</h5>
                {action}
            </div>
            {children}
        </div>
    )
}
