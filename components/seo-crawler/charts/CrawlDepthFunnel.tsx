import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RsPanel as ChartCard } from '../right-sidebar/primitives';

export default function CrawlDepthFunnel({
  data,
}: {
  data: { depth: string; count: number }[];
}) {
  return (
    <ChartCard title="Crawl Depth Distribution">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#888', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="depth"
            tick={{ fill: '#a0a0a0', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
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
            formatter={(value: number) => [`${value} pages`, 'Pages']}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            fill="#E63946"
            fillOpacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
