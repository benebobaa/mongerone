import { z } from 'zod';

export const budgetSchema = z.object({
  amount: z.number().positive('Budget amount must be greater than 0'),
  categoryId: z.string().uuid('Invalid category'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
