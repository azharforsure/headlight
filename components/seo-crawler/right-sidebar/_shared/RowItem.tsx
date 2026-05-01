import React from 'react'

export function RowItem({
    title, meta, badge, onClick, active,
}: {
    title: React.ReactNode
    meta?: React.ReactNode
    badge?: React.ReactNode
    onClick?: () => void
    active?: boolean
}) {
    const Tag: any = onClick ? 'button' : 'div'
    return (
        <Tag
            onClick={onClick}
            className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded transition-colors ${
                onClick ? 'hover:bg-[#161616] cursor-pointer' : ''
            } ${active ? 'bg-[#1a1a1a]' : ''}`}
        >
            <div className="min-w-0 flex-1">
                <div className="text-[11px] text-white truncate">{title}</div>
                {meta && <div className="text-[10px] text-[#777] truncate">{meta}</div>}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
        </Tag>
    )
}
