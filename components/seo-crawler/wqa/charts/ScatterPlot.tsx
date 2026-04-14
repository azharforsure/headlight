import React, { useMemo } from 'react';

interface Point { x: number; y: number; size: number; color: string; label: string; }
interface Props { data: Point[]; xLabel?: string; yLabel?: string; height?: number; }

export default function ScatterPlot({ data, xLabel = 'X', yLabel = 'Y', height = 180 }: Props) {
    const width = 260;
    const padding = { top: 10, right: 10, bottom: 24, left: 30 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const { xMin, xMax, yMax } = useMemo(() => {
        const xs = data.map((d) => d.x);
        const ys = data.map((d) => d.y);
        return {
            xMin: Math.min(1, ...xs),
            xMax: Math.max(100, ...xs),
            yMax: Math.max(15, ...ys),
        };
    }, [data]);

    const scaleX = (v: number) => padding.left + ((v - xMin) / Math.max(1, (xMax - xMin))) * plotW;
    const scaleY = (v: number) => padding.top + plotH - (v / Math.max(1, yMax)) * plotH;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
            {[0, 25, 50, 75, 100].map((v) => {
                const x = scaleX(v);
                return <line key={v} x1={x} y1={padding.top} x2={x} y2={padding.top + plotH} stroke="#111" strokeWidth="1" />;
            })}
            {data.map((d, i) => (
                <circle key={i} cx={scaleX(d.x)} cy={scaleY(d.y)} r={d.size} fill={d.color} opacity={0.7}>
                    <title>{d.label}: pos {d.x}, CTR {d.y.toFixed(1)}%</title>
                </circle>
            ))}
            <text x={width / 2} y={height - 2} textAnchor="middle" fill="#444" fontSize="9">{xLabel}</text>
            <text x={4} y={height / 2} textAnchor="middle" fill="#444" fontSize="9" transform={`rotate(-90, 8, ${height / 2})`}>{yLabel}</text>
        </svg>
    );
}
