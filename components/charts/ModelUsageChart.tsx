'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModelUsageChartProps {
  data: Record<string, any>;
}

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  const chartData = Object.entries(data).map(([model, usage]: [string, any]) => ({
    name: model,
    value: usage.inputTokens + usage.outputTokens,
    input: usage.inputTokens,
    output: usage.outputTokens,
    cached: usage.cacheReadInputTokens,
  }));

  const totalTokens = chartData.reduce((sum, item) => sum + item.value, 0);

  const getChartColor = (index: number) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${((percent || 0) * 100).toFixed(0)}%`
          }
          outerRadius={80}
          innerRadius={50}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getChartColor(index)}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
          }}
          formatter={(value: number | undefined, name: string | undefined, props: any) => {
            const item = props?.payload;
            return [
              `${(value || 0).toLocaleString()} tokens`,
              name || '',
            ];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
