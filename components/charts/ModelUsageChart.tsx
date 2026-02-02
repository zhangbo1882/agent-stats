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

// Dynamic unit formatter based on value magnitude
function formatTokens(value: number): { value: number; unit: string } {
  if (value >= 1000000000) {
    return { value: value / 1000000000, unit: 'B' };
  }
  if (value >= 1000000) {
    return { value: value / 1000000, unit: 'M' };
  }
  if (value >= 1000) {
    return { value: value / 1000, unit: 'K' };
  }
  return { value, unit: '' };
}

function formatTokensLabel(value: number): string {
  const { value: formatted, unit } = formatTokens(value);
  if (unit) {
    return `${formatted.toFixed(formatted < 10 ? 1 : 0)}${unit}`;
  }
  return `${formatted}`;
}

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  const chartData = Object.entries(data).map(([model, usage]: [string, any]) => ({
    name: model,
    value: (usage.inputTokens || 0) + (usage.outputTokens || 0) + (usage.cacheReadInputTokens || 0),
    input: usage.inputTokens || 0,
    output: usage.outputTokens || 0,
    cached: usage.cacheReadInputTokens || 0,
  }));

  const totalTokens = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalInput = chartData.reduce((sum, item) => sum + item.input, 0);
  const totalOutput = chartData.reduce((sum, item) => sum + item.output, 0);
  const totalCached = chartData.reduce((sum, item) => sum + item.cached, 0);

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
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Input</p>
          <p className="text-lg font-semibold text-blue-500">{formatTokensLabel(totalInput)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Output</p>
          <p className="text-lg font-semibold text-green-500">{formatTokensLabel(totalOutput)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cached</p>
          <p className="text-lg font-semibold text-purple-500">{formatTokensLabel(totalCached)}</p>
        </div>
      </div>

      {/* Pie chart */}
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
            formatter={(value: number, name: string) => {
              const item = chartData.find(d => d.name === name);
              const parts = [];
              if (item?.input) parts.push(`Input: ${formatTokensLabel(item.input)}`);
              if (item?.output) parts.push(`Output: ${formatTokensLabel(item.output)}`);
              if (item?.cached) parts.push(`Cached: ${formatTokensLabel(item.cached)}`);
              parts.push(`Total: ${formatTokensLabel(value || 0)}`);
              return [parts.join('\n'), name || ''];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total */}
      <div className="text-center text-sm text-muted-foreground">
        Total: {formatTokensLabel(totalTokens)} tokens
      </div>
    </div>
  );
}
