import React from 'react';

interface RadarPoint { axis: string; value: number; }
interface Props { data: RadarPoint[]; size?: number; }

export default function RadarChart({ data, size = 200 }: Props) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 30;
    const n = Math.max(1, data.length);
    const angleStep = (2 * Math.PI) / n;

    const getPoint = (i: number, r: number) => ({
        x: cx + r * Math.sin(i * angleStep),
        y: cy - r * Math.cos(i * angleStep),
    });

    const rings = [0.25, 0.5, 0.75, 1.0];
    const dataPoints = data.map((d, i) => getPoint(i, (d.value / 100) * radius));

    return (
        <div className="flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {rings.map((r) => (
                    <polygon
                        key={r}
                        points={data.map((_, i) => { const p = getPoint(i, r * radius); return `${p.x},${p.y}`; }).join(' ')}
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="1"
                    />
                ))}
                {data.map((_, i) => {
                    const p = getPoint(i, radius);
                    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1a1a1a" strokeWidth="1" />;
                })}
                <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="rgba(245,54,78,0.15)" stroke="#F5364E" strokeWidth="1.5" />
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#F5364E" />
                ))}
                {data.map((d, i) => {
                    const p = getPoint(i, radius + 16);
                    return (
                        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#666" fontSize="9" fontWeight="600">
                            {d.axis}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
