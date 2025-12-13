'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BudgetProgress } from './budget-progress';
import { Pencil, Trash2 } from 'lucide-react';
import type { BudgetWithProgress } from '@/lib/types';

interface BudgetCardProps {
  budget: BudgetWithProgress;
  onEdit: (budget: BudgetWithProgress) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPeriodBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      daily: 'default',
      weekly: 'secondary',
      monthly: 'outline',
      yearly: 'default',
    };
    return variants[budget.period] || 'outline';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">
            {budget.category?.name || 'Uncategorized'}
          </CardTitle>
          <Badge variant={getPeriodBadge()} className="capitalize">
            {budget.period}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(budget)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit budget</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Delete budget</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <BudgetProgress
          spent={budget.spent}
          amount={parseFloat(budget.amount)}
        />
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>From {formatDate(budget.startDate)}</span>
          {budget.endDate && <span>To {formatDate(budget.endDate)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
