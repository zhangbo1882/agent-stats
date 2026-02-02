'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DailyActivity } from '@/lib/types';

interface ActivityChartProps {
  data: DailyActivity[];
  metric?: 'messageCount' | 'sessionCount' | 'toolCallCount';
}

const metricConfig = {
  messageCount: {
    label: 'Messages',
    stroke: 'hsl(var(--chart-1))',
    fill: 'hsl(var(--chart-1) / 0.2)',
    dataKey: 'messageCount',
  },
  sessionCount: {
    label: 'Sessions',
    stroke: 'hsl(var(--chart-2))',
    fill: 'hsl(var(--chart-2) / 0.2)',
    dataKey: 'sessionCount',
  },
  toolCallCount: {
    label: 'Tool Calls',
    stroke: 'hsl(var(--chart-3))',
    fill: 'hsl(var(--chart-3) / 0.2)',
    dataKey: 'toolCallCount',
  },
};

export function ActivityChart({ data, metric = 'messageCount' }: ActivityChartProps) {
  const config = metricConfig[metric];

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    [config.dataKey]: item[config.dataKey as keyof DailyActivity],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`gradient-${config.dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.stroke} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={config.stroke} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" className="stroke-[1px]" />
        <XAxis
          dataKey="date"
          style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey={config.dataKey}
          stroke={config.stroke}
          strokeWidth={2.5}
          fill={`url(#gradient-${config.dataKey})`}
          name={config.label}
          activeDot={{ r: 6, strokeWidth: 0 }}
          dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
