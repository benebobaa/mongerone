import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTransactions } from '@/lib/actions/transactions';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export async function RecentTransactions() {
  const result = await getTransactions();

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load transactions</p>
        </CardContent>
      </Card>
    );
  }

  const recentTransactions = result.data.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </div>
        <Link
          href="/transactions"
          className="flex items-center text-sm font-medium text-primary hover:underline"
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No transactions yet. Create your first transaction to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {transaction.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    {transaction.category?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        transaction.type === 'income'
                          ? 'text-green-600 font-semibold'
                          : transaction.type === 'expense'
                          ? 'text-red-600 font-semibold'
                          : 'font-semibold'
                      }
                    >
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
