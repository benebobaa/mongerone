import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  type: z.enum(['income', 'expense', 'transfer']),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
