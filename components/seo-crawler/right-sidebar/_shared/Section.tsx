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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#666]">{title}</h4>
                {action && <div className="text-[10px] text-[#888]">{action}</div>}
            </header>
            {children}
        </section>
    )
}
