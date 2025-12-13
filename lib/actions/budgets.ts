'use server';

import { db } from '@/lib/db';
import { budgets, categories, transactions } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { budgetSchema } from '@/lib/validations/budget';
import type { ApiResponse, Budget, BudgetWithProgress } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getBudgets(): Promise<ApiResponse<BudgetWithProgress[]>> {
  try {
    const userId = await getCurrentUserId();
    const userBudgets = await db
      .select({
        budget: budgets,
        category: categories,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.createdAt));

    // Calculate progress for each budget
    const budgetsWithProgress = await Promise.all(
      userBudgets.map(async (row) => {
        const budget = row.budget;
        const category = row.category;

        // Calculate spent amount based on period
        const now = new Date();
        const startDate = new Date(budget.startDate);
        const endDate = budget.endDate ? new Date(budget.endDate) : now;

        const [result] = await db
          .select({
            total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.categoryId, budget.categoryId),
              eq(transactions.type, 'expense'),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          );

        const spent = parseFloat(result?.total || '0');
        const budgetAmount = parseFloat(budget.amount);
        const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        return {
          ...budget,
          category: category || undefined,
          spent,
          progress,
        };
      })
    );

    return { success: true, data: budgetsWithProgress };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBudgetById(
  budgetId: string
): Promise<ApiResponse<BudgetWithProgress | null>> {
  try {
    const userId = await getCurrentUserId();
    const result = await db
      .select({
        budget: budgets,
        category: categories,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
      .limit(1);

    if (!result[0]) {
      return { success: true, data: null };
    }

    const budget = result[0].budget;
    const category = result[0].category;

    // Calculate spent amount
    const now = new Date();
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : now;

    const [spentResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, budget.categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const spent = parseFloat(spentResult?.total || '0');
    const budgetAmount = parseFloat(budget.amount);
    const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    const budgetWithProgress = {
      ...budget,
      category: category || undefined,
      spent,
      progress,
    };

    return { success: true, data: budgetWithProgress };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createBudget(data: unknown): Promise<ApiResponse<Budget>> {
  try {
    const userId = await getCurrentUserId();
    const validated = budgetSchema.parse(data);

    // Verify category exists and belongs to user
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, validated.categoryId), eq(categories.userId, userId)));

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    // Check if a budget already exists for this category and period
    const [existingBudget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, validated.categoryId),
          eq(budgets.period, validated.period)
        )
      )
      .limit(1);

    if (existingBudget) {
      return {
        success: false,
        error: 'A budget for this category and period already exists',
      };
    }

    const [newBudget] = await db
      .insert(budgets)
      .values({
        userId,
        categoryId: validated.categoryId,
        amount: validated.amount.toString(),
        period: validated.period,
        startDate: validated.startDate.toISOString().split('T')[0],
        endDate: validated.endDate
          ? validated.endDate.toISOString().split('T')[0]
          : null,
      })
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/budgets');

    return { success: true, data: newBudget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBudget(
  budgetId: string,
  data: unknown
): Promise<ApiResponse<Budget>> {
  try {
    const userId = await getCurrentUserId();
    const validated = budgetSchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Budget not found' };
    }

    // Verify category exists and belongs to user
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, validated.categoryId), eq(categories.userId, userId)));

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    const [updatedBudget] = await db
      .update(budgets)
      .set({
        categoryId: validated.categoryId,
        amount: validated.amount.toString(),
        period: validated.period,
        startDate: validated.startDate.toISOString().split('T')[0],
        endDate: validated.endDate
          ? validated.endDate.toISOString().split('T')[0]
          : null,
      })
      .where(eq(budgets.id, budgetId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/budgets');

    return { success: true, data: updatedBudget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBudget(budgetId: string): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Budget not found' };
    }

    await db.delete(budgets).where(eq(budgets.id, budgetId));

    revalidatePath('/dashboard');
    revalidatePath('/budgets');

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBudgetProgress(
  budgetId: string
): Promise<
  ApiResponse<{
    budget: Budget;
    spent: number;
    remaining: number;
    progress: number;
  }>
> {
  try {
    const userId = await getCurrentUserId();

    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    // Calculate spent amount
    const now = new Date();
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : now;

    const [result] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, budget.categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const spent = parseFloat(result?.total || '0');
    const budgetAmount = parseFloat(budget.amount);
    const remaining = budgetAmount - spent;
    const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    return {
      success: true,
      data: {
        budget,
        spent,
        remaining,
        progress,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
