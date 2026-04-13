import React from 'react';
import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from 'recharts';

export interface RadarDataPoint {
    dimension: string;
    [domain: string]: string | number;
}

interface RadarComparisonChartProps {
    data: RadarDataPoint[];
    domains: Array<{ domain: string; color: string; isOwn?: boolean }>;
}

export default function RadarComparisonChart({ data, domains }: RadarComparisonChartProps) {
    if (data.length === 0) {
        return <div className="py-8 text-center text-[11px] text-[#555]">No data yet. Crawl competitors to compare.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#888', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#555', fontSize: 8 }} />
                {domains.map((d) => (
                    <Radar
                        key={d.domain}
                        name={d.isOwn ? 'Your Site' : d.domain}
                        dataKey={d.domain}
                        stroke={d.color}
                        fill={d.color}
                        fillOpacity={d.isOwn ? 0.15 : 0.05}
                        strokeWidth={d.isOwn ? 2 : 1}
                    />
                ))}
                <Legend wrapperStyle={{ fontSize: 10, color: '#888' }} />
            </RadarChart>
        </ResponsiveContainer>
    );
}
