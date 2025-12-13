'use server';

import { db } from '@/lib/db';
import { transactions, accounts, categories } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types';

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  balance: number;
}

export async function getIncomeExpenseReport(
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<MonthlyData[]>> {
  try {
    const userId = await getCurrentUserId();

    const results = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`, transactions.type)
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`);

    // Group by month
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    results.forEach((row) => {
      const month = row.month;
      const existing = monthlyMap.get(month) || { income: 0, expense: 0 };

      if (row.type === 'income') {
        existing.income += parseFloat(row.total);
      } else if (row.type === 'expense') {
        existing.expense += parseFloat(row.total);
      }

      monthlyMap.set(month, existing);
    });

    const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
      })
    );

    return { success: true, data: monthlyData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoryBreakdown(
  startDate: Date,
  endDate: Date,
  type: 'income' | 'expense' = 'expense'
): Promise<ApiResponse<CategoryBreakdown[]>> {
  try {
    const userId = await getCurrentUserId();

    const results = await db
      .select({
        category: categories.name,
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, type),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(CAST(${transactions.amount} AS DECIMAL))`));

    // Calculate total
    const total = results.reduce((sum, row) => sum + parseFloat(row.total), 0);

    const breakdown: CategoryBreakdown[] = results.map((row) => {
      const amount = parseFloat(row.total);
      return {
        category: row.category || 'Uncategorized',
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    });

    return { success: true, data: breakdown };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBalanceTrend(
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<TrendData[]>> {
  try {
    const userId = await getCurrentUserId();

    // Get all accounts
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    // Get all transactions in the date range
    const allTransactions = await db
      .select({
        date: sql<string>`DATE(${transactions.date})`,
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
      )
      .orderBy(transactions.date);

    // Calculate starting balance (sum of all accounts before start date)
    const startingBalanceResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
        type: transactions.type,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), lte(transactions.date, startDate)))
      .groupBy(transactions.type);

    let startingBalance = 0;
    startingBalanceResult.forEach((row) => {
      const amount = parseFloat(row.total);
      if (row.type === 'income') {
        startingBalance += amount;
      } else if (row.type === 'expense') {
        startingBalance -= amount;
      }
    });

    // Build daily balance trend
    const dailyBalances = new Map<string, number>();
    let currentBalance = startingBalance;

    allTransactions.forEach((transaction) => {
      const date = transaction.date;
      const amount = parseFloat(transaction.amount);

      if (transaction.type === 'income') {
        currentBalance += amount;
      } else if (transaction.type === 'expense') {
        currentBalance -= amount;
      }

      dailyBalances.set(date, currentBalance);
    });

    const trendData: TrendData[] = Array.from(dailyBalances.entries()).map(
      ([date, balance]) => ({
        date,
        balance,
      })
    );

    return { success: true, data: trendData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
