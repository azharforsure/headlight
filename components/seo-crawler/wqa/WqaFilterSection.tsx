import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Option {
	value: string;
	label: string;
	count: number;
}

interface Props {
	title: string;
	options: Option[];
	activeValue: string;
	onSelect: (value: string) => void;
	defaultOpen?: boolean;
	max?: number;
}

export default function WqaFilterSection({
	title,
	options,
	activeValue,
	onSelect,
	defaultOpen = true,
	max = 8,
}: Props) {
	const [open, setOpen] = useState(defaultOpen);
	const [showAll, setShowAll] = useState(false);

	const sorted = [...options].sort((a, b) => b.count - a.count);
	const visible = showAll ? sorted : sorted.slice(0, max);

	return (
		<div className="border-b border-[#1a1a1a] py-2">
			<button
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-[#ccc]"
			>
				<span>{title}</span>
				{open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
			</button>

			{open && (
				<div className="mt-1 space-y-0.5 px-1">
					{visible.map((opt) => {
						const active = opt.value === activeValue;
						return (
							<button
								key={opt.value}
								onClick={() => onSelect(opt.value)}
								className={`flex w-full items-center justify-between rounded px-2 py-1 text-[11px] transition-colors ${
									active
										? 'bg-[#F5364E]/10 text-[#F5364E]'
										: 'text-[#aaa] hover:bg-[#161616] hover:text-white'
								}`}
							>
								<span className="truncate">{opt.label}</span>
								<span
									className={`ml-2 shrink-0 font-mono text-[10px] ${
										active ? 'text-[#F5364E]' : 'text-[#555]'
									}`}
								>
									{(opt.count || 0).toLocaleString()}
								</span>
							</button>
						);
					})}
					{sorted.length > max && (
						<button
							onClick={() => setShowAll((v) => !v)}
							className="w-full px-2 py-1 text-left text-[10px] text-[#555] hover:text-[#aaa]"
						>
							{showAll ? 'Show less' : `Show ${sorted.length - max} more`}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
