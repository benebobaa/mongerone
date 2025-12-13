'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Play } from 'lucide-react';
import type { RecurringTransaction } from '@/lib/types';

interface RecurringCardProps {
  transaction: RecurringTransaction;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (transactionId: string) => void;
  onToggle: (id: string) => void;
  onExecute: (id: string) => void;
  toggling: boolean;
  executing: boolean;
}

const typeConfig: Record<string, 'default' | 'secondary' | 'destructive'> = {
  income: 'default',
  expense: 'destructive',
  transfer: 'secondary',
};

export function RecurringCard({
  transaction,
  onEdit,
  onDelete,
  onToggle,
  onExecute,
  toggling,
  executing,
}: RecurringCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFrequencyLabel = (frequency: string, interval: number | null) => {
    const intervalNum = interval || 1;
    const label = intervalNum > 1 ? `Every ${intervalNum} ${frequency}s` : frequency;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={typeConfig[transaction.type]} className="capitalize">
              {transaction.type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getFrequencyLabel(transaction.frequency, transaction.interval)}
            </span>
          </div>
        </div>
        <div className="text-xl font-bold">
          ${parseFloat(transaction.amount).toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">
              {transaction.description || (
                <span className="text-muted-foreground italic">No description</span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Next Run:</span>
              <p className="font-medium">{formatDate(transaction.nextRunDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Run:</span>
              <p className="font-medium">
                {transaction.lastRunDate ? formatDate(transaction.lastRunDate) : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch
              checked={transaction.active}
              onCheckedChange={() => onToggle(transaction.id)}
              disabled={toggling}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onExecute(transaction.id)}
          disabled={!transaction.active || executing}
        >
          <Play className="h-4 w-4 mr-2" />
          Execute
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(transaction)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
