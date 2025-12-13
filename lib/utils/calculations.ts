export function calculateBudgetProgress(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
}

export function calculateSavings(income: number, expenses: number): number {
  return income - expenses;
}

export function calculateTotalBalance(accounts: Array<{ balance: string | number }>): number {
  return accounts.reduce((total, account) => {
    const balance = typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance;
    return total + (isNaN(balance) ? 0 : balance);
  }, 0);
}
