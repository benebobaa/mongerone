'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RecurringTable } from '@/components/recurring/recurring-table';
import { RecurringDialog } from '@/components/recurring/recurring-dialog';
import { Plus } from 'lucide-react';
import { getRecurringTransactions, deleteRecurringTransaction } from '@/lib/actions/recurring-transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { toast } from 'sonner';
import type { RecurringTransaction, Account, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecurringPage() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsResult, accountsResult, categoriesResult] = await Promise.all([
        getRecurringTransactions(),
        getAccounts(),
        getCategories(),
      ]);

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data);
      }

      if (accountsResult.success) {
        setAccounts(accountsResult.data);
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }

    const result = await deleteRecurringTransaction(transactionId);
    if (result.success) {
      toast.success('Recurring transaction deleted successfully');
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const handleSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Recurring Transactions</h2>
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recurring Transactions</h2>
          <p className="text-muted-foreground">
            Manage automatic transactions that repeat on a schedule
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No recurring transactions</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven&apos;t set up any recurring transactions yet. Create one to automate
              your regular income or expenses.
            </p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Transaction
            </Button>
          </div>
        </div>
      ) : (
        <RecurringTable
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdate={loadData}
        />
      )}

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        recurring={editingTransaction}
        accounts={accounts}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
