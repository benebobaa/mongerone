import { z } from 'zod';

export const recurringTransactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer']),
  accountId: z.string().uuid('Invalid account'),
  categoryId: z.string().uuid('Invalid category').optional(),
  description: z.string().max(500).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive(),
  startDate: z.date(),
  active: z.boolean(),
});

export type RecurringTransactionFormData = z.infer<typeof recurringTransactionSchema>;
