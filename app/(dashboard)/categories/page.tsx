'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import { getCategories } from '@/lib/actions/categories';
import { CategoryTree } from '@/components/categories/category-tree';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  const loadCategories = async () => {
    setIsLoading(true);
    const result = await getCategories();
    if (result.success) {
      setCategories(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCategory(null);
      loadCategories();
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setSelectedCategory(null);
      loadCategories();
    }
  };

  const incomeCategories = categories.filter((cat) => cat.type === 'income');
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Organize your transactions with custom categories
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="expense">
              Expense Categories ({expenseCategories.length})
            </TabsTrigger>
            <TabsTrigger value="income">
              Income Categories ({incomeCategories.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <TabsContent value="expense" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expenseCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <p className="text-muted-foreground mb-4">
                No expense categories yet. Create your first category to get started.
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <CategoryTree
              categories={expenseCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : incomeCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <p className="text-muted-foreground mb-4">
                No income categories yet. Create your first category to get started.
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <CategoryTree
              categories={incomeCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>
      </Tabs>

      <CategoryDialog
        category={selectedCategory}
        categories={categories}
        type={activeTab}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <DeleteCategoryDialog
        category={selectedCategory}
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
      />
    </div>
  );
}
