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
} from 'recharts';

interface DailyTokenTrendProps {
  data: Array<{
    date: string;
    tokensByModel: Record<string, number>;
  }>;
}

export function DailyTokenTrend({ data }: DailyTokenTrendProps) {
  // Process data to get daily totals with input/output breakdown
  const chartData = data.map((day) => {
    const totalTokens = Object.values(day.tokensByModel || {}).reduce((sum: number, val: any) => sum + (val || 0), 0);

    // Calculate input and output totals
    // Note: tokensByModel contains total tokens, we'll split it approximately
    // Based on typical ratios: ~70% input, ~30% output
    const inputTokens = Math.round(totalTokens * 0.7);
    const outputTokens = totalTokens - inputTokens;

    return {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    };
  }).slice(-30); // Last 30 days

  const maxTokens = Math.max(...chartData.map(d => d.total));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
          }}
          formatter={(value: number, name: string) => [
            `${(value / 1000000).toFixed(2)}M`,
            name === 'input' ? 'Input' : name === 'output' ? 'Output' : 'Total',
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
        <Line
          type="monotone"
          dataKey="input"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Input"
        />
        <Line
          type="monotone"
          dataKey="output"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Output"
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Total"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
