import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RsPanel as ChartCard } from '../right-sidebar/primitives';

const getBarColor = (range: string) => {
  const start = parseInt(range.split('-')[0]);
  if (start >= 80) return '#4ade80';
  if (start >= 60) return '#60a5fa';
  if (start >= 40) return '#fbbf24';
  if (start >= 20) return '#fb923c';
  return '#f87171';
};

export default function ScoreHistogram({
  data,
}: {
  data: { range: string; count: number }[];
}) {
  return (
    <ChartCard title="Score Distribution">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis
            dataKey="range"
            tick={{ fill: '#888', fontSize: 10 }}
            axisLine={{ stroke: '#333' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#888', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
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
            formatter={(value: number) => [`${value} pages`, 'Count']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.range} fill={getBarColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
