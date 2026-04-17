import React from 'react';

export default function SparkBar({
    value, max = 100, color = '#F5364E', height = 4,
}: { value: number; max?: number; color?: string; height?: number }) {
    const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
    return (
        <div className="w-full bg-[#161616] rounded-full overflow-hidden" style={{ height }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}
