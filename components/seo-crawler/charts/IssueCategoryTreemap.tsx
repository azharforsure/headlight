import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';

const CATEGORY_COLORS: Record<string, string> = {
  Content: '#f87171',
  'On-Page': '#fb923c',
  Performance: '#fbbf24',
  Links: '#60a5fa',
  Images: '#a78bfa',
  Security: '#f472b6',
  Accessibility: '#34d399',
  Technical: '#94a3b8',
};

function CustomTreemapContent(props: any) {
  const { x, y, width, height, name, size } = props;
  if (width < 40 || height < 30) return null;

  return (
    <g>
      <rect
        x={x} y={y}
        width={width} height={height}
        fill={CATEGORY_COLORS[name] || '#555'}
        fillOpacity={0.8}
        stroke="#0A0A0B"
        strokeWidth={2}
        rx={4}
      />
      {width > 60 && (
        <>
          <text
            x={x + width / 2} y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontSize={11}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2} y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize={10}
          >
            {size}
          </text>
        </>
      )}
    </g>
  );
}

export default function IssueCategoryTreemap({
  data,
}: {
  data: { name: string; size: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Issues by Category">
        <div className="flex items-center justify-center h-[240px] text-green-400 text-xs">
          ✓ No issues found.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Issues by Category">
      <ResponsiveContainer width="100%" height={240}>
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          content={<CustomTreemapContent />}
        />
      </ResponsiveContainer>
      <Tooltip
        contentStyle={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 8,
          fontSize: 12,
          color: '#f5f5f5',
        }}
        itemStyle={{ color: '#f5f5f5' }}
      />
    </ChartCard>
  );
}
