'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportTransactionsToCSV, type TransactionExport } from '@/lib/utils/export';
import { getTransactions } from '@/lib/actions/transactions';
import { toast } from 'sonner';

interface ExportButtonProps {
  startDate: Date;
  endDate: Date;
}

export function ExportButton({ startDate, endDate }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await getTransactions();

      if (result.success) {
        // Filter transactions by date range
        const filtered = result.data.filter((transaction) => {
          const date = new Date(transaction.date);
          return date >= startDate && date <= endDate;
        });

        // Transform to export format
        const exportData: TransactionExport[] = filtered.map((transaction) => ({
          date: new Date(transaction.date).toLocaleDateString(),
          type: transaction.type,
          amount: parseFloat(transaction.amount).toFixed(2),
          category: transaction.category?.name || 'Uncategorized',
          account: transaction.account?.name || 'Unknown',
          description: transaction.description || '',
        }));

        // Generate filename with date range
        const filename = `transactions_${startDate.toISOString().split('T')[0]}_to_${
          endDate.toISOString().split('T')[0]
        }.csv`;

        exportTransactionsToCSV(exportData, filename);
        toast.success('Transactions exported successfully');
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline">
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
