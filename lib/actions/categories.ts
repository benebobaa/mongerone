'use server';

import { db } from '@/lib/db';
import { categories, transactions, budgets } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, desc } from 'drizzle-orm';
import { categorySchema } from '@/lib/validations/category';
import type { ApiResponse, Category } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const userId = await getCurrentUserId();
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.type, categories.name);

    return { success: true, data: userCategories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoriesByType(
  type: 'income' | 'expense' | 'transfer'
): Promise<ApiResponse<Category[]>> {
  try {
    const userId = await getCurrentUserId();
    const userCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.type, type)))
      .orderBy(categories.name);

    return { success: true, data: userCategories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoryById(categoryId: string): Promise<ApiResponse<Category | null>> {
  try {
    const userId = await getCurrentUserId();
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    return { success: true, data: category || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(data: unknown): Promise<ApiResponse<Category>> {
  try {
    const userId = await getCurrentUserId();
    const validated = categorySchema.parse(data);

    // If parentId is provided, verify it exists and belongs to user
    if (validated.parentId) {
      const [parent] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, validated.parentId), eq(categories.userId, userId)));

      if (!parent) {
        return { success: false, error: 'Parent category not found' };
      }
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId,
        name: validated.name,
        type: validated.type,
        icon: validated.icon || null,
        color: validated.color || null,
        parentId: validated.parentId || null,
      })
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/categories');
    revalidatePath('/transactions');

    return { success: true, data: newCategory };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategory(
  categoryId: string,
  data: unknown
): Promise<ApiResponse<Category>> {
  try {
    const userId = await getCurrentUserId();
    const validated = categorySchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Category not found' };
    }

    // If parentId is provided, verify it exists and belongs to user
    if (validated.parentId) {
      const [parent] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, validated.parentId), eq(categories.userId, userId)));

      if (!parent) {
        return { success: false, error: 'Parent category not found' };
      }

      // Prevent circular references
      if (validated.parentId === categoryId) {
        return { success: false, error: 'Category cannot be its own parent' };
      }
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: validated.name,
        type: validated.type,
        icon: validated.icon || null,
        color: validated.color || null,
        parentId: validated.parentId || null,
      })
      .where(eq(categories.id, categoryId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/categories');
    revalidatePath('/transactions');

    return { success: true, data: updatedCategory };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Category not found' };
    }

    // Check for child categories
    const [childCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .limit(1);

    if (childCategory) {
      return {
        success: false,
        error: 'Cannot delete category with subcategories. Delete subcategories first.',
      };
    }

    // Check for related transactions
    const [relatedTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId))
      .limit(1);

    if (relatedTransaction) {
      return {
        success: false,
        error: 'Cannot delete category with existing transactions. Delete transactions first or reassign them to another category.',
      };
    }

    // Check for related budgets
    const [relatedBudget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.categoryId, categoryId))
      .limit(1);

    if (relatedBudget) {
      return {
        success: false,
        error: 'Cannot delete category with existing budgets. Delete budgets first.',
      };
    }

    await db.delete(categories).where(eq(categories.id, categoryId));

    revalidatePath('/dashboard');
    revalidatePath('/categories');
    revalidatePath('/transactions');

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
