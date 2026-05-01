import React from 'react'

export function RsList<T>({
    items, render, empty = 'No data',
}: {
    items: T[]
    render: (item: T, i: number) => React.ReactNode
    empty?: string
}) {
    if (!items || items.length === 0) {
        return <div className="text-[11px] text-[#666] py-2">{empty}</div>
    }
    return <div className="space-y-1">{items.map((item, i) => <React.Fragment key={i}>{render(item, i)}</React.Fragment>)}</div>
}
