'use server';

import { db } from '@/lib/db';
import { recurringTransactions, accounts, categories, transactions } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, desc, lte } from 'drizzle-orm';
import { recurringTransactionSchema } from '@/lib/validations/recurring';
import type { ApiResponse, RecurringTransaction } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getRecurringTransactions(): Promise<
  ApiResponse<RecurringTransaction[]>
> {
  try {
    const userId = await getCurrentUserId();
    const recurring = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(desc(recurringTransactions.nextRunDate));

    return { success: true, data: recurring };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveRecurringTransactions(): Promise<
  ApiResponse<RecurringTransaction[]>
> {
  try {
    const userId = await getCurrentUserId();
    const recurring = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.active, true))
      )
      .orderBy(desc(recurringTransactions.nextRunDate));

    return { success: true, data: recurring };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRecurringTransactionById(
  recurringId: string
): Promise<ApiResponse<RecurringTransaction | null>> {
  try {
    const userId = await getCurrentUserId();
    const [recurring] = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.id, recurringId), eq(recurringTransactions.userId, userId))
      );

    return { success: true, data: recurring || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRecurringTransaction(
  data: unknown
): Promise<ApiResponse<RecurringTransaction>> {
  try {
    const userId = await getCurrentUserId();
    const validated = recurringTransactionSchema.parse(data);

    // Verify account exists and belongs to user
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)));

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Verify category if provided
    if (validated.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, validated.categoryId), eq(categories.userId, userId)));

      if (!category) {
        return { success: false, error: 'Category not found' };
      }
    }

    // Calculate next run date
    const nextRunDate = calculateNextRunDate(validated.startDate, validated.frequency, validated.interval);

    const [newRecurring] = await db
      .insert(recurringTransactions)
      .values({
        userId,
        accountId: validated.accountId,
        categoryId: validated.categoryId || null,
        amount: validated.amount.toString(),
        type: validated.type,
        description: validated.description || null,
        frequency: validated.frequency,
        interval: validated.interval,
        startDate: validated.startDate.toISOString().split('T')[0],
        nextRunDate: nextRunDate.toISOString().split('T')[0],
        active: validated.active,
      })
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/recurring');

    return { success: true, data: newRecurring };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRecurringTransaction(
  recurringId: string,
  data: unknown
): Promise<ApiResponse<RecurringTransaction>> {
  try {
    const userId = await getCurrentUserId();
    const validated = recurringTransactionSchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.id, recurringId), eq(recurringTransactions.userId, userId))
      );

    if (!existing) {
      return { success: false, error: 'Recurring transaction not found' };
    }

    // Verify account exists and belongs to user
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)));

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Verify category if provided
    if (validated.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, validated.categoryId), eq(categories.userId, userId)));

      if (!category) {
        return { success: false, error: 'Category not found' };
      }
    }

    // Recalculate next run date if frequency or interval changed
    const nextRunDate = calculateNextRunDate(validated.startDate, validated.frequency, validated.interval);

    const [updatedRecurring] = await db
      .update(recurringTransactions)
      .set({
        accountId: validated.accountId,
        categoryId: validated.categoryId || null,
        amount: validated.amount.toString(),
        type: validated.type,
        description: validated.description || null,
        frequency: validated.frequency,
        interval: validated.interval,
        startDate: validated.startDate.toISOString().split('T')[0],
        nextRunDate: nextRunDate.toISOString().split('T')[0],
        active: validated.active,
      })
      .where(eq(recurringTransactions.id, recurringId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/recurring');

    return { success: true, data: updatedRecurring };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRecurringTransaction(
  recurringId: string
): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.id, recurringId), eq(recurringTransactions.userId, userId))
      );

    if (!existing) {
      return { success: false, error: 'Recurring transaction not found' };
    }

    await db.delete(recurringTransactions).where(eq(recurringTransactions.id, recurringId));

    revalidatePath('/dashboard');
    revalidatePath('/recurring');

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleRecurringTransaction(
  recurringId: string
): Promise<ApiResponse<RecurringTransaction>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.id, recurringId), eq(recurringTransactions.userId, userId))
      );

    if (!existing) {
      return { success: false, error: 'Recurring transaction not found' };
    }

    const [updated] = await db
      .update(recurringTransactions)
      .set({ active: !existing.active })
      .where(eq(recurringTransactions.id, recurringId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/recurring');

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeRecurringTransaction(
  recurringId: string
): Promise<ApiResponse<RecurringTransaction>> {
  try {
    const userId = await getCurrentUserId();

    // Get recurring transaction
    const [recurring] = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(eq(recurringTransactions.id, recurringId), eq(recurringTransactions.userId, userId))
      );

    if (!recurring) {
      return { success: false, error: 'Recurring transaction not found' };
    }

    if (!recurring.active) {
      return { success: false, error: 'Recurring transaction is not active' };
    }

    // Create transaction from recurring
    const amount = parseFloat(recurring.amount);
    await db.insert(transactions).values({
      userId,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      amount: recurring.amount,
      type: recurring.type,
      description: recurring.description,
      date: new Date(),
      recurringTransactionId: recurring.id,
    });

    // Update account balance
    const [account] = await db.select().from(accounts).where(eq(accounts.id, recurring.accountId));
    if (account) {
      const currentBalance = parseFloat(account.balance);
      let newBalance = currentBalance;

      if (recurring.type === 'income') {
        newBalance = currentBalance + amount;
      } else if (recurring.type === 'expense') {
        newBalance = currentBalance - amount;
      }

      await db
        .update(accounts)
        .set({ balance: newBalance.toString(), updatedAt: new Date() })
        .where(eq(accounts.id, recurring.accountId));
    }

    // Calculate next run date
    const currentNextRun = new Date(recurring.nextRunDate);
    const newNextRunDate = calculateNextRunDate(
      currentNextRun,
      recurring.frequency,
      recurring.interval || 1
    );

    // Update recurring transaction
    const [updated] = await db
      .update(recurringTransactions)
      .set({
        lastRunDate: new Date().toISOString().split('T')[0],
        nextRunDate: newNextRunDate.toISOString().split('T')[0],
      })
      .where(eq(recurringTransactions.id, recurringId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/recurring');
    revalidatePath('/transactions');
    revalidatePath('/accounts');

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeDueRecurringTransactions(): Promise<
  ApiResponse<{ executed: number }>
> {
  try {
    const userId = await getCurrentUserId();
    const today = new Date().toISOString().split('T')[0];

    // Get all due recurring transactions
    const dueRecurring = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactions.active, true),
          lte(recurringTransactions.nextRunDate, today)
        )
      );

    let executed = 0;

    for (const recurring of dueRecurring) {
      const result = await executeRecurringTransaction(recurring.id);
      if (result.success) {
        executed++;
      }
    }

    return { success: true, data: { executed } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper function to calculate next run date
function calculateNextRunDate(
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number = 1
): Date {
  const nextDate = new Date(startDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }

  return nextDate;
}
