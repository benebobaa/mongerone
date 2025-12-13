'use server';

import { db } from '@/lib/db';
import { accounts, transactions } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, desc } from 'drizzle-orm';
import { accountSchema } from '@/lib/validations/account';
import type { ApiResponse, Account } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getAccounts(): Promise<ApiResponse<Account[]>> {
  try {
    const userId = await getCurrentUserId();
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.isDefault), desc(accounts.createdAt));

    return { success: true, data: userAccounts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAccountById(accountId: string): Promise<ApiResponse<Account | null>> {
  try {
    const userId = await getCurrentUserId();
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    return { success: true, data: account || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAccount(data: unknown): Promise<ApiResponse<Account>> {
  try {
    const userId = await getCurrentUserId();
    const validated = accountSchema.parse(data);

    // If this is set as default, unset other defaults
    if (validated.isDefault) {
      await db
        .update(accounts)
        .set({ isDefault: false })
        .where(eq(accounts.userId, userId));
    }

    const [newAccount] = await db
      .insert(accounts)
      .values({
        userId,
        name: validated.name,
        type: validated.type,
        balance: validated.balance.toString(),
        isDefault: validated.isDefault,
      })
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: newAccount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAccount(
  accountId: string,
  data: unknown
): Promise<ApiResponse<Account>> {
  try {
    const userId = await getCurrentUserId();
    const validated = accountSchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Account not found' };
    }

    // If this is set as default, unset other defaults
    if (validated.isDefault) {
      await db
        .update(accounts)
        .set({ isDefault: false })
        .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)));
    }

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        name: validated.name,
        type: validated.type,
        balance: validated.balance.toString(),
        isDefault: validated.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: updatedAccount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(accountId: string): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Account not found' };
    }

    // Check for related transactions
    const [relatedTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .limit(1);

    if (relatedTransaction) {
      return {
        success: false,
        error: 'Cannot delete account with existing transactions. Delete transactions first.',
      };
    }

    await db.delete(accounts).where(eq(accounts.id, accountId));

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAccountBalance(
  accountId: string,
  amount: number,
  operation: 'add' | 'subtract'
): Promise<ApiResponse<Account>> {
  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    if (!existing) {
      return { success: false, error: 'Account not found' };
    }

    const currentBalance = parseFloat(existing.balance);
    const newBalance =
      operation === 'add' ? currentBalance + amount : currentBalance - amount;

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        balance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning();

    return { success: true, data: updatedAccount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
