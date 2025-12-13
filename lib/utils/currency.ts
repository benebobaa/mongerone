export function formatCurrency(amount: number | string, currencyCode: string = 'USD', symbol?: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  // If symbol is provided, use it directly
  if (symbol) {
    return `${symbol}${numAmount.toFixed(2)}`;
  }

  // Otherwise use Intl.NumberFormat
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(numAmount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${numAmount.toFixed(2)} ${currencyCode}`;
  }
}

export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbols and spaces
  const cleaned = formattedAmount.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
