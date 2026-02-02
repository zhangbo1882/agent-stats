import { Card, CardContent } from './Card';
import { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('group cursor-pointer hover:border-primary/50 transition-colors', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between pb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">
                {typeof value === 'number' ? formatNumber(value) : value}
              </p>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    trend.isPositive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'}
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 transition-all group-hover:bg-primary/20 group-hover:scale-110">
            <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
