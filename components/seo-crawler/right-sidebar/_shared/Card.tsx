import React from 'react'

export function Card({
	children, className = '', padded = true, tone = 'default', title,
}: {
	children: React.ReactNode
	className?: string
	padded?: boolean
	tone?: 'default' | 'sunken' | 'accent'
	title?: string
}) {
	const bg =
		tone === 'sunken' ? 'bg-[#0a0a0a]' :
		tone === 'accent' ? 'bg-[#F5364E]/[0.06]' :
		'bg-[#111]'
	const border =
		tone === 'accent' ? 'border-[#F5364E]/25' : 'border-[#1f1f1f]'

	return (
		<div className={`rounded-md border ${border} ${bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${padded ? 'p-3' : ''} ${className}`}>
			{title && (
				<div className={`flex items-center justify-between ${padded ? 'mb-2.5' : 'px-3 pt-3 pb-2'}`}>
					<h5 className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">{title}</h5>
				</div>
			)}
			{children}
		</div>
	)
}
