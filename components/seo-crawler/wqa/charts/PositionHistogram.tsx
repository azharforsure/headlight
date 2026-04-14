import React from 'react';

interface BucketData { label: string; count: number; }
interface Props { data: BucketData[]; }

const BUCKET_COLORS: Record<string, string> = {
    '1-3': '#22c55e',
    '4-10': '#3b82f6',
    '11-20': '#8b5cf6',
    '21-50': '#f59e0b',
    '50+': '#ef4444',
    'None': '#333',
};

export default function PositionHistogram({ data }: Props) {
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="space-y-1">
            {data.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#888] w-10 text-right">{d.label}</span>
                    <div className="flex-1 h-3 bg-[#1a1a1a] rounded overflow-hidden">
                        <div
                            className="h-full rounded"
                            style={{
                                width: `${(d.count / maxCount) * 100}%`,
                                backgroundColor: BUCKET_COLORS[d.label] || '#666',
                            }}
                        />
                    </div>
                    <span className="text-[#555] w-10 font-mono text-right">{d.count}</span>
                </div>
            ))}
        </div>
    );
}
