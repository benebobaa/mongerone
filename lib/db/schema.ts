import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, integer, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "transfer"]);
export const accountTypeEnum = pgEnum("account_type", ["bank", "cash", "mobile_money", "wallet", "credit_card"]);
export const budgetPeriodEnum = pgEnum("budget_period", ["daily", "weekly", "monthly", "yearly"]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["daily", "weekly", "monthly", "yearly"]);

// Profiles (Users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  currencyCode: varchar("currency_code", { length: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Currencies
export const currencies = pgTable("currencies", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  decimalPlaces: integer("decimal_places").default(2).notNull(),
});

// Accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  toAccountId: uuid("to_account_id").references(() => accounts.id),
  recurringTransactionId: uuid("recurring_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Budgets
export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  period: budgetPeriodEnum("period").default("monthly").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recurring Transactions
export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  interval: integer("interval").default(1),
  startDate: date("start_date").notNull(),
  nextRunDate: date("next_run_date").notNull(),
  lastRunDate: date("last_run_date"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(profiles, { fields: [accounts.userId], references: [profiles.id] }),
  transactions: many(transactions),
  outgoingTransfers: many(transactions, { relationName: 'outgoing_transfers' }),
  incomingTransfers: many(transactions, { relationName: 'incoming_transfers' }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(profiles, { fields: [categories.userId], references: [profiles.id] }),
  transactions: many(transactions),
  budgets: many(budgets),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'parent_category' }),
  children: many(categories, { relationName: 'parent_category' }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(profiles, { fields: [transactions.userId], references: [profiles.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  toAccount: one(accounts, { fields: [transactions.toAccountId], references: [accounts.id], relationName: 'incoming_transfers' }),
  outgoingAccount: one(accounts, { fields: [transactions.accountId], references: [accounts.id], relationName: 'outgoing_transfers' }),
  recurringTransaction: one(recurringTransactions, { fields: [transactions.recurringTransactionId], references: [recurringTransactions.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(profiles, { fields: [budgets.userId], references: [profiles.id] }),
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  user: one(profiles, { fields: [recurringTransactions.userId], references: [profiles.id] }),
  account: one(accounts, { fields: [recurringTransactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [recurringTransactions.categoryId], references: [categories.id] }),
  transactions: many(transactions),
}));
