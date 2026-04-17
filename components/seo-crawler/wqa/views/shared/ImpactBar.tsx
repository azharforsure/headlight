import React from 'react';
import SparkBar from './SparkBar';

export default function ImpactBar({
    value, max, color = '#22c55e',
}: { value: number; max: number; color?: string }) {
    return (
        <div className="flex items-center gap-2">
            <SparkBar value={value} max={max} color={color} height={5} />
            <span className="text-[10px] font-mono text-[#999] shrink-0 w-[52px] text-right">
                {Math.round(value).toLocaleString()}
            </span>
        </div>
    );
}
