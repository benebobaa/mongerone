import { NextRequest, NextResponse } from 'next/server';
import { executeDueRecurringTransactions } from '@/lib/jobs/execute-recurring';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await executeDueRecurringTransactions();

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
