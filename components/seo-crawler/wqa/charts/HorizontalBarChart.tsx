import React from 'react';

interface BarData { label: string; value: number; color?: string; }
interface Props { data: BarData[]; formatValue?: (v: number) => string; onClick?: (label: string) => void; }

export default function HorizontalBarChart({ data, formatValue = (v) => String(v), onClick }: Props) {
    const maxVal = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="space-y-1.5">
            {data.map((d) => (
                <div key={d.label} className={`group ${onClick ? 'cursor-pointer' : ''}`} onClick={() => onClick?.(d.label)}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-[#888] group-hover:text-white transition-colors truncate max-w-[60%]">{d.label}</span>
                        <span className="text-[#555] font-mono group-hover:text-green-400 transition-colors">{formatValue(d.value)}</span>
                    </div>
                    <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all group-hover:brightness-125"
                            style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: d.color || '#F5364E' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
