import React from 'react'
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between border-b border-[#1a1a1a] pb-1 mb-2">
			<h4 className="text-[10px] uppercase tracking-widest text-[#666] font-bold">{children}</h4>
			{action}
		</div>
	)
}
