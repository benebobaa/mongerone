import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccounts } from '@/lib/actions/accounts';
import { Wallet, CreditCard, Smartphone, Banknote, Building2 } from 'lucide-react';

const accountTypeIcons = {
  bank: Building2,
  cash: Banknote,
  mobile_money: Smartphone,
  wallet: Wallet,
  credit_card: CreditCard,
};

export async function AccountSummary() {
  const result = await getAccounts();

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Your accounts overview</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load accounts</p>
        </CardContent>
      </Card>
    );
  }

  const accounts = result.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Summary</CardTitle>
        <CardDescription>Your accounts overview</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No accounts yet. Create your first account to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Wallet;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {account.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${parseFloat(account.balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
