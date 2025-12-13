import { SummaryCard } from '@/components/dashboard/summary-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AccountSummary } from '@/components/dashboard/account-summary';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { CategoryBreakdownChart } from '@/components/dashboard/category-breakdown-chart';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions, getTransactionStats } from '@/lib/actions/transactions';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export default async function DashboardPage() {
  // Fetch all required data
  const [accountsResult, transactionsResult, currentMonthStatsResult] = await Promise.all([
    getAccounts(),
    getTransactions(),
    getTransactionStats(startOfMonth(new Date()), endOfMonth(new Date())),
  ]);

  // Calculate total balance
  const totalBalance = accountsResult.success
    ? accountsResult.data.reduce((sum, account) => sum + parseFloat(account.balance), 0)
    : 0;

  // Get current month stats
  const currentMonthIncome = currentMonthStatsResult.success
    ? currentMonthStatsResult.data.totalIncome
    : 0;
  const currentMonthExpense = currentMonthStatsResult.success
    ? currentMonthStatsResult.data.totalExpense
    : 0;
  const currentMonthSavings = currentMonthIncome - currentMonthExpense;

  // Prepare data for Income vs Expense chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));

    const statsResult = await getTransactionStats(monthStart, monthEnd);

    monthlyData.push({
      month: format(monthStart, 'MMM'),
      income: statsResult.success ? statsResult.data.totalIncome : 0,
      expense: statsResult.success ? statsResult.data.totalExpense : 0,
    });
  }

  // Prepare data for Category Breakdown chart (current month expenses)
  const categoryBreakdown: { name: string; value: number; color: string }[] = [];

  if (transactionsResult.success) {
    const currentMonthTransactions = transactionsResult.data.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      return (
        transaction.type === 'expense' &&
        transactionDate >= monthStart &&
        transactionDate <= monthEnd
      );
    });

    // Aggregate by category
    const categoryMap = new Map<string, { value: number; color: string }>();
    currentMonthTransactions.forEach((transaction) => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryColor = transaction.category?.color || '#64748b';
      const amount = parseFloat(transaction.amount);

      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        categoryMap.set(categoryName, {
          value: existing.value + amount,
          color: categoryColor,
        });
      } else {
        categoryMap.set(categoryName, { value: amount, color: categoryColor });
      }
    });

    categoryMap.forEach((data, name) => {
      categoryBreakdown.push({ name, value: data.value, color: data.color });
    });

    // Sort by value descending
    categoryBreakdown.sort((a, b) => b.value - a.value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your finances.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          value={`$${totalBalance.toFixed(2)}`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Income"
          value={`$${currentMonthIncome.toFixed(2)}`}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Expenses"
          value={`$${currentMonthExpense.toFixed(2)}`}
          icon={TrendingDown}
        />
        <SummaryCard
          title="Savings"
          value={`$${currentMonthSavings.toFixed(2)}`}
          icon={PiggyBank}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <IncomeExpenseChart data={monthlyData} />
        <CategoryBreakdownChart data={categoryBreakdown} />
      </div>

      {/* Recent Transactions and Account Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <AccountSummary />
        </div>
      </div>
    </div>
  );
}
