'use client';

import { TransactionWithRelations } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: TransactionWithRelations;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (transaction: TransactionWithRelations) => void;
}

const typeConfig = {
  income: {
    label: 'Income',
    icon: ArrowDownLeft,
    className: 'text-green-600',
    badgeVariant: 'default' as const,
  },
  expense: {
    label: 'Expense',
    icon: ArrowUpRight,
    className: 'text-red-600',
    badgeVariant: 'destructive' as const,
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowRightLeft,
    className: 'text-blue-600',
    badgeVariant: 'secondary' as const,
  },
};

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;
  const amount = parseFloat(transaction.amount);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant} className="gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(transaction.date), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        <div className={`text-xl font-bold ${config.className}`}>
          {transaction.type === 'expense' && '-'}
          {transaction.type === 'income' && '+'}
          ${amount.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">
              {transaction.description || (
                <span className="text-muted-foreground italic">No description</span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Account:</span>
              <p className="font-medium">{transaction.account?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <p className="font-medium">
                {transaction.category?.name || (
                  <span className="text-muted-foreground">Uncategorized</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(transaction)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={() => onDelete(transaction)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
