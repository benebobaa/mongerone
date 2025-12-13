'use client';

import { useState, useEffect, useMemo } from 'react';
import { TransactionWithRelations, Account, Category } from '@/lib/types';
import { getTransactions } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog';
import {
  TransactionFilters,
  FilterState,
} from '@/components/transactions/transaction-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});

  const loadData = async () => {
    setIsLoading(true);
    const [transactionsResult, accountsResult, categoriesResult] =
      await Promise.all([
        getTransactions(),
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (filters.type) {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.accountId) {
      result = result.filter((t) => t.accountId === filters.accountId);
    }

    if (filters.categoryId) {
      result = result.filter((t) => t.categoryId === filters.categoryId);
    }

    if (filters.startDate) {
      result = result.filter(
        (t) => new Date(t.date) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      result = result.filter(
        (t) => new Date(t.date) <= filters.endDate!
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.account?.name.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [transactions, filters]);

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTransaction(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedTransaction(null);
      loadData();
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setSelectedTransaction(null);
      loadData();
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Track and manage all your financial transactions
          </p>
        </div>
        <Button onClick={handleAddNew} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionFilters
        accounts={accounts}
        categories={categories}
        onFiltersChange={handleFiltersChange}
      />

      {isLoading ? (
        <div className="border rounded-lg p-12">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-muted-foreground mb-4">
            No transactions yet. Create your first transaction to get started.
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      <TransactionDialog
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <DeleteTransactionDialog
        transaction={selectedTransaction}
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
      />
    </div>
  );
}
