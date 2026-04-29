import React from 'react'
import { AlertTriangle } from 'lucide-react'
export function RsError({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
			<AlertTriangle size={20} className="text-orange-400 mb-3" />
			<div className="text-[12px] text-white font-semibold">Something went wrong</div>
			<div className="text-[11px] text-[#666] mt-1 max-w-[260px]">{message}</div>
		</div>
	)
}
