import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import ChartCard from './ChartCard';

export default function ContentQualityRadar({
  data,
}: {
  data: { metric: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Content Quality">
        <div className="flex items-center justify-center h-[240px] text-[#666] text-xs">
          No HTML pages to analyze.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Content Quality">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#2a2a2a" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#a0a0a0', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="#E63946"
            fill="#E63946"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              fontSize: 12,
              color: '#f5f5f5',
            }}
            itemStyle={{ color: '#f5f5f5' }}
            formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
