import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RsPanel as ChartCard } from '../right-sidebar/primitives';

const COLORS: Record<string, string> = {
  '2xx': '#4ade80',
  '3xx': '#fb923c',
  '4xx': '#f87171',
  '5xx': '#991b1b',
  Other: '#555',
};

export default function StatusDonut({
  data,
  total,
}: {
  data: { name: string; value: number }[];
  total: number;
}) {
  return (
    <ChartCard title="Status Distribution">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            stroke="#0A0A0B"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#555'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              fontSize: 12,
              color: '#f5f5f5',
            }}
            itemStyle={{ color: '#f5f5f5' }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#a0a0a0', fontSize: 11 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-2">
        <span className="text-2xl font-black text-white">{total}</span>
        <span className="text-[11px] text-[#666] ml-1">total URLs</span>
      </div>
    </ChartCard>
  );
}
