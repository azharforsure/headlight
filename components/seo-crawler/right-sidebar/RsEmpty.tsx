import React from 'react'
import { Inbox } from 'lucide-react'

export function RsEmpty({ title, hint, cta }: {
	title: string
	hint?: string
	cta?: { label: string; onClick: () => void }
}) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
			<Inbox size={20} className="text-[#444] mb-3" />
			<div className="text-[12px] text-white font-semibold">{title}</div>
			{hint && <div className="text-[11px] text-[#666] mt-1 max-w-[260px]">{hint}</div>}
			{cta && (
				<button
					onClick={cta.onClick}
					className="mt-4 px-3 py-1.5 text-[11px] font-bold bg-[#F5364E] text-white rounded hover:bg-[#df3248] transition-colors"
				>{cta.label}</button>
			)}
		</div>
	)
}
