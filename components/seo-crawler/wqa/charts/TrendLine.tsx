import React from 'react';

interface Point { x: string; y: number; }
interface Props { data: Point[]; height?: number; color?: string; }

export default function TrendLine({ data, height = 140, color = '#3b82f6' }: Props) {
    if (!data || data.length === 0) return null;

    const width = 260;
    const padding = { top: 12, right: 10, bottom: 20, left: 24 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const yMax = Math.max(...data.map((d) => d.y), 1);

    const points = data.map((d, i) => {
        const x = padding.left + (i / Math.max(1, data.length - 1)) * plotW;
        const y = padding.top + plotH - (d.y / yMax) * plotH;
        return { x, y, d };
    });

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
            <path d={path} fill="none" stroke={color} strokeWidth="2" />
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color}>
                    <title>{p.d.x}: {p.d.y}</title>
                </circle>
            ))}
        </svg>
    );
}
