import React from 'react'

export function RsCard({
    title, subtitle, action, children, dense = false,
}: {
    title?: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
    dense?: boolean
}) {
    return (
        <section className="rounded border border-[#1f1f1f] bg-[#0f0f0f]">
            {(title || action) && (
                <header className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div>
                        {title && <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">{title}</h4>}
                        {subtitle && <p className="text-[10px] text-[#666] mt-0.5">{subtitle}</p>}
                    </div>
                    {action}
                </header>
            )}
            <div className={dense ? 'px-3 pb-2.5' : 'px-3 pb-3'}>{children}</div>
        </section>
    )
}
