import React from 'react';

interface Segment { label: string; value: number; color: string; }
interface Props { data: Segment[]; size?: number; }

export default function DonutChart({ data, size = 160 }: Props) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR * 0.6;
    let cumAngle = -Math.PI / 2;

    const segments = data.filter((d) => d.value > 0).map((d) => {
        const angle = (d.value / total) * 2 * Math.PI;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;

        const x1 = cx + outerR * Math.cos(startAngle);
        const y1 = cy + outerR * Math.sin(startAngle);
        const x2 = cx + outerR * Math.cos(endAngle);
        const y2 = cy + outerR * Math.sin(endAngle);
        const x3 = cx + innerR * Math.cos(endAngle);
        const y3 = cy + innerR * Math.sin(endAngle);
        const x4 = cx + innerR * Math.cos(startAngle);
        const y4 = cy + innerR * Math.sin(startAngle);
        const largeArc = angle > Math.PI ? 1 : 0;

        const path = `M${x1},${y1} A${outerR},${outerR} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc},0 ${x4},${y4} Z`;

        return { ...d, path };
    });

    return (
        <div className="flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((seg, i) => (
                    <path key={i} d={seg.path} fill={seg.color} stroke="#0a0a0a" strokeWidth="1" />
                ))}
                <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">
                    {total.toLocaleString()}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#555" fontSize="9">pages</text>
            </svg>
        </div>
    );
}
