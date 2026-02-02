'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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

const COLORS = {
  input: 'hsl(var(--chart-1))',
  output: 'hsl(var(--chart-2))',
  cached: 'hsl(var(--chart-3))',
};

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  const chartData = Object.entries(data).map(([model, usage]: [string, any]) => ({
    model,
    input: usage.inputTokens || 0,
    output: usage.outputTokens || 0,
    cached: usage.cacheReadInputTokens || 0,
    total: (usage.inputTokens || 0) + (usage.outputTokens || 0), // Exclude cached from total
  }));

  const totalInput = chartData.reduce((sum, item) => sum + item.input, 0);
  const totalOutput = chartData.reduce((sum, item) => sum + item.output, 0);
  const totalCached = chartData.reduce((sum, item) => sum + item.cached, 0);
  const totalTokens = totalInput + totalOutput; // Exclude cached

  // Prepare pie data for each model
  const modelsWithPieData = chartData
    .filter(item => item.total > 0)
    .map(item => ({
      model: item.model,
      pieData: [
        { name: 'Input', value: item.input, color: COLORS.input },
        { name: 'Output', value: item.output, color: COLORS.output },
      ],
    }));

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

      {/* Pie charts - one per model */}
      {modelsWithPieData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No model usage data
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modelsWithPieData.map(({ model, pieData }) => {
            const total = pieData.reduce((sum, item) => sum + item.value, 0);
            return (
              <div key={model} className="flex flex-col items-center">
                <h4 className="text-sm font-medium mb-2">{model}</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={60}
                      innerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
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
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                      formatter={(value: number) => [
                        `${formatTokensLabel(value)}`,
                        '',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {formatTokensLabel(total)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall total */}
      <div className="text-center text-sm text-muted-foreground">
        Total: {formatTokensLabel(totalTokens)} tokens (excluding cached)
      </div>
    </div>
  );
}
