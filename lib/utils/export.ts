export function generateCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface TransactionExport {
  date: string;
  type: string;
  amount: string;
  category: string;
  account: string;
  description: string;
}

export function exportTransactionsToCSV(
  transactions: TransactionExport[],
  filename: string = 'transactions.csv'
): void {
  const headers = ['date', 'type', 'amount', 'category', 'account', 'description'];
  const csv = generateCSV(transactions, headers);
  downloadCSV(csv, filename);
}
