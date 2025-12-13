'use server';

import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ApiResponse, Currency } from '@/lib/types';

export async function getCurrencies(): Promise<ApiResponse<Currency[]>> {
  try {
    const allCurrencies = await db.select().from(currencies).orderBy(currencies.code);

    return { success: true, data: allCurrencies };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCurrencyByCode(code: string): Promise<ApiResponse<Currency | null>> {
  try {
    const [currency] = await db.select().from(currencies).where(eq(currencies.code, code));

    return { success: true, data: currency || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPopularCurrencies(): Promise<ApiResponse<Currency[]>> {
  try {
    // Return a list of popular currencies
    const popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR'];

    const popularCurrencies = await db
      .select()
      .from(currencies)
      .where(
        eq(currencies.code, popularCodes[0])
      );

    // If we need all popular currencies, we'd need to use an IN clause
    // For now, let's get all and filter in memory
    const allCurrencies = await db.select().from(currencies);
    const filtered = allCurrencies.filter((c) => popularCodes.includes(c.code));

    return { success: true, data: filtered };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
