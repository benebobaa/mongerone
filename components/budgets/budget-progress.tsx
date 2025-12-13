'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  spent: number;
  amount: number;
  className?: string;
}

export function BudgetProgress({ spent, amount, className }: BudgetProgressProps) {
  const percentage = amount > 0 ? (spent / amount) * 100 : 0;
  const remaining = amount - spent;

  // Color coding based on percentage
  const getColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-orange-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-medium', getColor())}>
          ${spent.toFixed(2)} spent
        </span>
        <span className="text-muted-foreground">
          ${remaining.toFixed(2)} remaining
        </span>
      </div>
      <div className="relative">
        <Progress value={Math.min(percentage, 100)} className="h-2" />
        <div
          className={cn('absolute inset-0 h-2 rounded-full transition-all', getProgressColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{percentage.toFixed(0)}% used</span>
        <span>${amount.toFixed(2)} budget</span>
      </div>
    </div>
  );
}
