'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Play } from 'lucide-react';
import { toggleRecurringTransaction, executeRecurringTransaction } from '@/lib/actions/recurring-transactions';
import { toast } from 'sonner';
import type { RecurringTransaction } from '@/lib/types';
import { RecurringCard } from './recurring-card';

interface RecurringTableProps {
  transactions: RecurringTransaction[];
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (transactionId: string) => void;
  onUpdate: () => void;
}

export function RecurringTable({
  transactions,
  onEdit,
  onDelete,
  onUpdate,
}: RecurringTableProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const result = await toggleRecurringTransaction(id);
      if (result.success) {
        toast.success(
          result.data.active
            ? 'Recurring transaction activated'
            : 'Recurring transaction deactivated'
        );
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle transaction');
    } finally {
      setToggling(null);
    }
  };

  const handleExecute = async (id: string) => {
    setExecuting(id);
    try {
      const result = await executeRecurringTransaction(id);
      if (result.success) {
        toast.success('Transaction executed successfully');
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute transaction');
    } finally {
      setExecuting(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      income: 'default',
      expense: 'destructive',
      transfer: 'secondary',
    };
    return variants[type] || 'default';
  };

  const getFrequencyLabel = (frequency: string, interval: number | null) => {
    const intervalNum = interval || 1;
    const label = intervalNum > 1 ? `Every ${intervalNum} ${frequency}s` : frequency;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-sm text-muted-foreground">
          No recurring transactions found
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card View */}
      <div className="md:hidden space-y-4">
        {transactions.map((transaction) => (
          <RecurringCard
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={handleToggle}
            onExecute={handleExecute}
            toggling={toggling === transaction.id}
            executing={executing === transaction.id}
          />
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge variant={getTypeBadge(transaction.type)} className="capitalize">
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  ${parseFloat(transaction.amount).toFixed(2)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description || '-'}
                </TableCell>
                <TableCell>
                  {getFrequencyLabel(transaction.frequency, transaction.interval)}
                </TableCell>
                <TableCell>{formatDate(transaction.nextRunDate)}</TableCell>
                <TableCell>
                  {transaction.lastRunDate ? formatDate(transaction.lastRunDate) : '-'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={transaction.active}
                    onCheckedChange={() => handleToggle(transaction.id)}
                    disabled={toggling === transaction.id}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExecute(transaction.id)}
                      disabled={!transaction.active || executing === transaction.id}
                      title="Execute now"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
