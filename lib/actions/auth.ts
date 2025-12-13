'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ApiResponse } from '@/lib/types';

export async function logout(): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/auth/login');
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
