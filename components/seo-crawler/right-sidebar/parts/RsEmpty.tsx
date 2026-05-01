import React from 'react'

export function RsEmpty({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="grid place-items-center py-6 px-3 text-center">
            <div className="w-9 h-9 mx-auto rounded-full border border-dashed border-[#2a2a2a] mb-2" />
            <p className="text-[12px] font-medium text-[#bbb]">{title}</p>
            {hint && <p className="mt-1 text-[10px] text-[#666] max-w-[220px]">{hint}</p>}
        </div>
    )
}
