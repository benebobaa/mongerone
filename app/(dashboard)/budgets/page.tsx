'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BudgetCard } from '@/components/budgets/budget-card';
import { BudgetDialog } from '@/components/budgets/budget-dialog';
import { Plus } from 'lucide-react';
import { getBudgets, deleteBudget } from '@/lib/actions/budgets';
import { getCategories } from '@/lib/actions/categories';
import { toast } from 'sonner';
import type { BudgetWithProgress, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsResult, categoriesResult] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);

      if (budgetsResult.success) {
        setBudgets(budgetsResult.data);
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (budget: BudgetWithProgress) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    const result = await deleteBudget(budgetId);
    if (result.success) {
      toast.success('Budget deleted successfully');
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingBudget(null);
    }
  };

  const handleSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">
            Manage your spending limits and track your progress
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No budgets created</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven&apos;t created any budgets yet. Start by creating your first budget to
              track your spending.
            </p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        budget={editingBudget}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
