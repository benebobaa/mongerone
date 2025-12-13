import type {
  accounts,
  transactions,
  categories,
  budgets,
  profiles,
  currencies,
  recurringTransactions
} from '@/lib/db/schema';

// Base types from schema
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;

// Extended types with relations
export type TransactionWithRelations = Transaction & {
  account?: Account;
  category?: Category;
  toAccount?: Account;
};

export type AccountWithBalance = Account & {
  transactionsCount?: number;
};

export type BudgetWithProgress = Budget & {
  category?: Category;
  spent: number;
  progress: number;
};

export type CategoryWithParent = Category & {
  parent?: Category;
  children?: Category[];
};

// API Response types
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
