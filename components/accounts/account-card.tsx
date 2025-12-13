'use client';

import { Account } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Wallet, Building2, Smartphone, CreditCard } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const accountTypeIcons = {
  bank: Building2,
  cash: Wallet,
  mobile_money: Smartphone,
  wallet: Wallet,
  credit_card: CreditCard,
};

const accountTypeLabels = {
  bank: 'Bank',
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  wallet: 'Wallet',
  credit_card: 'Credit Card',
};

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountTypeIcons[account.type];
  const balance = parseFloat(account.balance);
  const isNegative = balance < 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{account.name}</h3>
            <p className="text-sm text-muted-foreground">
              {accountTypeLabels[account.type]}
            </p>
          </div>
        </div>
        {account.isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          <span className={isNegative ? 'text-red-600' : ''}>
            ${Math.abs(balance).toFixed(2)}
          </span>
        </div>
        {isNegative && (
          <p className="text-xs text-red-600 mt-1">Overdrawn</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(account)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={() => onDelete(account)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
