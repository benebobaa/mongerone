'use server';

import { db } from '@/lib/db';
import { transactions, accounts, categories } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, desc, gte, lte, sql, between } from 'drizzle-orm';
import { transactionSchema } from '@/lib/validations/transaction';
import type { ApiResponse, Transaction, TransactionWithRelations } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { updateAccountBalance } from './accounts';

export async function getTransactions(): Promise<ApiResponse<TransactionWithRelations[]>> {
  try {
    const userId = await getCurrentUserId();
    const userTransactions = await db
      .select({
        transaction: transactions,
        account: accounts,
        category: categories,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    const formattedTransactions = userTransactions.map((row) => ({
      ...row.transaction,
      account: row.account || undefined,
      category: row.category || undefined,
    }));

    return { success: true, data: formattedTransactions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTransactionById(
  transactionId: string
): Promise<ApiResponse<TransactionWithRelations | null>> {
  try {
    const userId = await getCurrentUserId();
    const result = await db
      .select({
        transaction: transactions,
        account: accounts,
        category: categories,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
      .limit(1);

    if (!result[0]) {
      return { success: true, data: null };
    }

    const formatted = {
      ...result[0].transaction,
      account: result[0].account || undefined,
      category: result[0].category || undefined,
    };

    return { success: true, data: formatted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTransaction(data: unknown): Promise<ApiResponse<Transaction>> {
  try {
    const userId = await getCurrentUserId();
    const validated = transactionSchema.parse(data);

    // Verify account ownership
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)));

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // For transfers, verify toAccount ownership
    if (validated.type === 'transfer' && validated.toAccountId) {
      const [toAccount] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, validated.toAccountId), eq(accounts.userId, userId)));

      if (!toAccount) {
        return { success: false, error: 'Destination account not found' };
      }
    }

    // Create transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: validated.accountId,
        categoryId: validated.categoryId || null,
        amount: validated.amount.toString(),
        type: validated.type,
        description: validated.description || null,
        date: validated.date,
        toAccountId: validated.toAccountId || null,
      })
      .returning();

    // Update account balances
    if (validated.type === 'income') {
      await updateAccountBalance(validated.accountId, validated.amount, 'add');
    } else if (validated.type === 'expense') {
      await updateAccountBalance(validated.accountId, validated.amount, 'subtract');
    } else if (validated.type === 'transfer' && validated.toAccountId) {
      await updateAccountBalance(validated.accountId, validated.amount, 'subtract');
      await updateAccountBalance(validated.toAccountId, validated.amount, 'add');
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/accounts');

    return { success: true, data: newTransaction };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTransaction(
  transactionId: string,
  data: unknown
): Promise<ApiResponse<Transaction>> {
  try {
    const userId = await getCurrentUserId();
    const validated = transactionSchema.parse(data);

    // Get existing transaction
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    // Verify account ownership
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)));

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // For transfers, verify toAccount ownership
    if (validated.type === 'transfer' && validated.toAccountId) {
      const [toAccount] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, validated.toAccountId), eq(accounts.userId, userId)));

      if (!toAccount) {
        return { success: false, error: 'Destination account not found' };
      }
    }

    // Reverse old transaction balance changes
    const oldAmount = parseFloat(existing.amount);
    if (existing.type === 'income') {
      await updateAccountBalance(existing.accountId, oldAmount, 'subtract');
    } else if (existing.type === 'expense') {
      await updateAccountBalance(existing.accountId, oldAmount, 'add');
    } else if (existing.type === 'transfer' && existing.toAccountId) {
      await updateAccountBalance(existing.accountId, oldAmount, 'add');
      await updateAccountBalance(existing.toAccountId, oldAmount, 'subtract');
    }

    // Update transaction
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        accountId: validated.accountId,
        categoryId: validated.categoryId || null,
        amount: validated.amount.toString(),
        type: validated.type,
        description: validated.description || null,
        date: validated.date,
        toAccountId: validated.toAccountId || null,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // Apply new transaction balance changes
    if (validated.type === 'income') {
      await updateAccountBalance(validated.accountId, validated.amount, 'add');
    } else if (validated.type === 'expense') {
      await updateAccountBalance(validated.accountId, validated.amount, 'subtract');
    } else if (validated.type === 'transfer' && validated.toAccountId) {
      await updateAccountBalance(validated.accountId, validated.amount, 'subtract');
      await updateAccountBalance(validated.toAccountId, validated.amount, 'add');
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/accounts');

    return { success: true, data: updatedTransaction };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTransaction(transactionId: string): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // Get existing transaction
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    // Reverse balance changes
    const amount = parseFloat(existing.amount);
    if (existing.type === 'income') {
      await updateAccountBalance(existing.accountId, amount, 'subtract');
    } else if (existing.type === 'expense') {
      await updateAccountBalance(existing.accountId, amount, 'add');
    } else if (existing.type === 'transfer' && existing.toAccountId) {
      await updateAccountBalance(existing.accountId, amount, 'add');
      await updateAccountBalance(existing.toAccountId, amount, 'subtract');
    }

    // Delete transaction
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/accounts');

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTransactionStats(
  startDate?: Date,
  endDate?: Date
): Promise<
  ApiResponse<{
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
  }>
> {
  try {
    const userId = await getCurrentUserId();

    let query = db
      .select({
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    // Apply date filters if provided
    if (startDate && endDate) {
      query = db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    } else if (startDate) {
      query = db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), gte(transactions.date, startDate)));
    } else if (endDate) {
      query = db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), lte(transactions.date, endDate)));
    }

    const results = await query;

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = results.length;

    results.forEach((row) => {
      const amount = parseFloat(row.amount);
      if (row.type === 'income') {
        totalIncome += amount;
      } else if (row.type === 'expense') {
        totalExpense += amount;
      }
      // transfers don't count towards income/expense
    });

    const netAmount = totalIncome - totalExpense;

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
