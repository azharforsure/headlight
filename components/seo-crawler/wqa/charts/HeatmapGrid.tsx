import React from 'react';

interface HeatCell { x: string; y: string; value: number; }
interface Props { data: HeatCell[]; }

export default function HeatmapGrid({ data }: Props) {
    if (!data.length) return null;

    const xs = Array.from(new Set(data.map((d) => d.x)));
    const ys = Array.from(new Set(data.map((d) => d.y)));
    const max = Math.max(...data.map((d) => d.value), 1);

    const getVal = (x: string, y: string) => data.find((d) => d.x === x && d.y === y)?.value || 0;

    return (
        <div className="space-y-1">
            {ys.map((y) => (
                <div key={y} className="flex items-center gap-1">
                    <span className="w-16 text-[9px] text-[#666] truncate">{y}</span>
                    <div className="flex gap-1">
                        {xs.map((x) => {
                            const value = getVal(x, y);
                            const alpha = value / max;
                            return (
                                <div
                                    key={`${x}-${y}`}
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: `rgba(59,130,246,${Math.max(0.08, alpha)})` }}
                                    title={`${x} / ${y}: ${value}`}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
