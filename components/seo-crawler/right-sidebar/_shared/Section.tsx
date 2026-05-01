import React from 'react'

export function Section({
    title, action, children, dense = false,
}: {
    title: string
    action?: React.ReactNode
    children: React.ReactNode
    dense?: boolean
}) {
    return (
        <section className={dense ? 'mb-3' : 'mb-4'}>
            <header className="flex items-center justify-between mb-2 px-0.5">
                <h4 className="text-[11px] font-medium text-[#888] tracking-wide">{title}</h4>
                {action && <div className="text-[10px] text-[#888]">{action}</div>}
            </header>
            {children}
        </section>
    )
}
