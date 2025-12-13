'use server';

import { db } from '@/lib/db';
import { profiles, categories } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/utils/auth';
import { eq } from 'drizzle-orm';
import { defaultCategoriesData } from '@/lib/db/seeds/default-categories';
import type { ApiResponse, Profile } from '@/lib/types';

export async function getProfile(): Promise<ApiResponse<Profile | null>> {
  try {
    const userId = await getCurrentUserId();
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));

    return { success: true, data: profile || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function ensureProfile(email: string): Promise<ApiResponse<Profile>> {
  try {
    const userId = await getCurrentUserId();

    // Check if profile exists
    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.id, userId));

    if (existingProfile) {
      return { success: true, data: existingProfile };
    }

    // Create profile
    const [newProfile] = await db.insert(profiles).values({
      id: userId,
      email,
      currencyCode: 'USD',
    }).returning();

    // Create default categories for this user
    const categoriesToInsert = defaultCategoriesData.map(cat => ({
      userId,
      ...cat,
    }));

    await db.insert(categories).values(categoriesToInsert);

    return { success: true, data: newProfile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfile(data: { fullName?: string; avatarUrl?: string; currencyCode?: string }): Promise<ApiResponse<Profile>> {
  try {
    const userId = await getCurrentUserId();

    const [updatedProfile] = await db.update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    return { success: true, data: updatedProfile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
