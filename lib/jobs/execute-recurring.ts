'use server';

import { db } from '@/lib/db';
import { recurringTransactions, transactions, accounts } from '@/lib/db/schema';
import { and, eq, lte } from 'drizzle-orm';

export async function executeDueRecurringTransactions() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all active recurring transactions that are due
    const dueRecurring = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.active, true),
          lte(recurringTransactions.nextRunDate, today)
        )
      );

    let executed = 0;
    const errors: string[] = [];

    for (const recurring of dueRecurring) {
      try {
        // Create transaction from recurring
        const amount = parseFloat(recurring.amount);
        await db.insert(transactions).values({
          userId: recurring.userId,
          accountId: recurring.accountId,
          categoryId: recurring.categoryId,
          amount: recurring.amount,
          type: recurring.type,
          description: recurring.description,
          date: new Date(),
          recurringTransactionId: recurring.id,
        });

        // Update account balance
        const [account] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, recurring.accountId));

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
        await db
          .update(recurringTransactions)
          .set({
            lastRunDate: new Date().toISOString().split('T')[0],
            nextRunDate: newNextRunDate.toISOString().split('T')[0],
          })
          .where(eq(recurringTransactions.id, recurring.id));

        executed++;
      } catch (error: any) {
        errors.push(`Failed to execute recurring transaction ${recurring.id}: ${error.message}`);
      }
    }

    return {
      success: true,
      executed,
      total: dueRecurring.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

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
