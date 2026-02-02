'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  total: 'hsl(var(--chart-1))',
};

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  // Process each model's data
  const modelsWithPieData = Object.entries(data)
    .map(([model, usage]: [string, any]) => {
      // For API data with only totalTokens
      if (usage.totalTokens && !usage.inputTokens && !usage.outputTokens) {
        return {
          model,
          pieData: [
            { name: 'Total', value: usage.totalTokens, color: COLORS.total }
          ],
          input: 0,
          output: 0,
          total: usage.totalTokens,
          isTotalOnly: true,
        };
      }

      // For cache data with breakdown
      const input = usage.inputTokens || 0;
      const output = usage.outputTokens || 0;

      return {
        model,
        pieData: [
          { name: 'Input', value: input, color: COLORS.input },
          { name: 'Output', value: output, color: COLORS.output },
        ],
        input,
        output,
        total: input + output,
        isTotalOnly: false,
      };
    })
    .filter(item => item.total > 0);

  const totalInput = modelsWithPieData.reduce((sum, item) => sum + item.input, 0);
  const totalOutput = modelsWithPieData.reduce((sum, item) => sum + item.output, 0);
  const totalTokens = totalInput + totalOutput;

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
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{formatTokensLabel(totalTokens)}</p>
        </div>
      </div>

      {/* Pie charts - one per model */}
      {modelsWithPieData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No model usage data
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modelsWithPieData.map(({ model, pieData, input, output, total, isTotalOnly }) => {
            return (
              <div key={model} className="flex flex-col items-center">
                <h4 className="text-sm font-medium mb-2">{model}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
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
                      formatter={(value: any, name?: any) => {
                        const total = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
                        const percent = total > 0 ? ((value || 0) / total * 100).toFixed(0) : '0';
                        return [`${formatTokensLabel(value || 0)} (${percent}%)`, name || ''];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value: string, entry: any) => {
                        const total = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
                        const item = pieData.find((d: any) => d.name === value);
                        const percent = total > 0 && item ? ((item.value / total) * 100).toFixed(0) : '0';
                        return (
                          <span style={{ color: entry.color }}>
                            {value} {percent}%
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Show complete data breakdown below each pie chart */}
                {!isTotalOnly ? (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center w-full">
                    <div>
                      <p className="text-muted-foreground">In</p>
                      <p className="font-medium">{formatTokensLabel(input)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Out</p>
                      <p className="font-medium">{formatTokensLabel(output)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{formatTokensLabel(total)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-center w-full">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{formatTokensLabel(total)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall total */}
      <div className="text-center text-sm text-muted-foreground">
        Total: {formatTokensLabel(totalTokens)} tokens
      </div>
    </div>
  );
}
