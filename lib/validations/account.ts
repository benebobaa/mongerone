import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: z.enum(['bank', 'cash', 'mobile_money', 'wallet', 'credit_card']),
  balance: z.number(),
  isDefault: z.boolean(),
});

export type AccountFormData = z.infer<typeof accountSchema>;
