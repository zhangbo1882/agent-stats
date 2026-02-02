'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
    input: usage.inputTokens || 0,
    output: usage.outputTokens || 0,
    cached: usage.cacheReadInputTokens || 0,
    total: (usage.inputTokens || 0) + (usage.outputTokens || 0) + (usage.cacheReadInputTokens || 0),
  }));

  const totalTokens = chartData.reduce((sum, item) => sum + item.total, 0);
  const totalInput = chartData.reduce((sum, item) => sum + item.input, 0);
  const totalOutput = chartData.reduce((sum, item) => sum + item.output, 0);
  const totalCached = chartData.reduce((sum, item) => sum + item.cached, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Input</p>
          <p className="text-lg font-semibold text-blue-500">{(totalInput / 1000000).toFixed(2)}M</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Output</p>
          <p className="text-lg font-semibold text-green-500">{(totalOutput / 1000000).toFixed(2)}M</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cached</p>
          <p className="text-lg font-semibold text-purple-500">{(totalCached / 1000000).toFixed(2)}M</p>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis
            dataKey="name"
            type="category"
            width={80}
            tick={{ fontSize: 12 }}
            className="text-xs"
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
              name === 'input' ? 'Input' : name === 'output' ? 'Output' : 'Cached',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
          <Bar dataKey="cached" stackId="a" fill="hsl(var(--chart-3))" name="Cached" radius={[0, 4, 4, 0]} />
          <Bar dataKey="input" stackId="a" fill="hsl(var(--chart-1))" name="Input" radius={[0, 4, 4, 0]} />
          <Bar dataKey="output" stackId="a" fill="hsl(var(--chart-2))" name="Output" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Total */}
      <div className="text-center text-sm text-muted-foreground">
        Total: {(totalTokens / 1000000).toFixed(2)}M tokens
      </div>
    </div>
  );
}
