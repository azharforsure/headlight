import React from 'react'

export function Card({
    children, className = '', padded = true, tone = 'default',
}: {
    children: React.ReactNode
    className?: string
    padded?: boolean
    tone?: 'default' | 'sunken' | 'accent'
}) {
    const bg =
        tone === 'sunken' ? 'bg-[#0a0a0a]' :
        tone === 'accent' ? 'bg-[#F5364E]/[0.06]' :
        'bg-[#111]'
    const border =
        tone === 'accent' ? 'border-[#F5364E]/25' : 'border-[#1f1f1f]'
    return (
        <div className={`rounded-md border ${border} ${bg} ${padded ? 'p-3' : ''} ${className}`}>
            {children}
        </div>
    )
}
