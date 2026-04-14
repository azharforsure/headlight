import React from 'react';

interface Segment { label: string; value: number; color: string; }
interface Props { data: Segment[]; }

export default function StackedBar({ data }: Props) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return null;

    return (
        <div>
            <div className="h-3 rounded-full overflow-hidden bg-[#1a1a1a] flex">
                {data.map((d) => (
                    <div key={d.label} style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }} />
                ))}
            </div>
            <div className="mt-2 space-y-1">
                {data.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-[10px]">
                        <span className="text-[#888] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.label}</span>
                        <span className="text-[#555] font-mono">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
