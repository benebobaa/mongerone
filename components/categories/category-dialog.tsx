'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Category } from '@/lib/types';
import { categorySchema, CategoryFormData } from '@/lib/validations/category';
import { createCategory, updateCategory } from '@/lib/actions/categories';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryIconPicker } from './category-icon-picker';
import { CategoryColorPicker } from './category-color-picker';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CategoryDialogProps {
  category?: Category | null;
  categories: Category[];
  type: 'income' | 'expense';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDialog({
  category,
  categories,
  type,
  open,
  onOpenChange,
}: CategoryDialogProps) {
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: type,
      icon: 'Wallet',
      color: '#3B82F6',
      parentId: null,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        type: category.type,
        icon: category.icon || 'Wallet',
        color: category.color || '#3B82F6',
        parentId: category.parentId || null,
      });
    } else {
      form.reset({
        name: '',
        type: type,
        icon: 'Wallet',
        color: '#3B82F6',
        parentId: null,
      });
    }
  }, [category, type, form]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const result = isEditing
        ? await updateCategory(category.id, data)
        : await createCategory(data);

      if (result.success) {
        toast.success(
          isEditing
            ? 'Category updated successfully'
            : 'Category created successfully'
        );
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error || 'Failed to save category');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  // Filter parent categories - only show categories of the same type
  const parentCategories = categories.filter(
    (cat) =>
      cat.type === type &&
      (!category || cat.id !== category.id) && // Exclude current category
      !cat.parentId // Only show root categories as potential parents
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update category details below.'
              : `Add a new ${type} category to organize your transactions.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries, Salary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CategoryIconPicker
                      value={field.value || 'Wallet'}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CategoryColorPicker
                      value={field.value || '#3B82F6'}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? null : value)
                    }
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None - Root category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None - Root category</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
