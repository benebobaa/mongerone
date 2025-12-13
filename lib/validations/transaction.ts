import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer']),
  accountId: z.string().uuid('Invalid account'),
  categoryId: z.string().uuid('Invalid category').optional().or(z.literal('')),
  date: z.date(),
  description: z.string().max(500).optional().or(z.literal('')),
  toAccountId: z.string().uuid('Invalid destination account').optional().or(z.literal('')),
}).refine((data) => {
  // If type is transfer, toAccountId is required
  if (data.type === 'transfer' && !data.toAccountId) {
    return false;
  }
  return true;
}, {
  message: 'Destination account is required for transfers',
  path: ['toAccountId'],
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
