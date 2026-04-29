import React from 'react'
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={`bg-[#0a0a0a] border border-[#222] rounded p-3 ${className}`}>
			{children}
		</div>
	)
}
