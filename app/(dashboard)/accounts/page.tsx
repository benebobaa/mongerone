'use client';

import { useState } from 'react';
import { Account } from '@/lib/types';
import { getAccounts } from '@/lib/actions/accounts';
import { AccountCard } from '@/components/accounts/account-card';
import { AccountDialog } from '@/components/accounts/account-dialog';
import { DeleteAccountDialog } from '@/components/accounts/delete-account-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = async () => {
    setIsLoading(true);
    const result = await getAccounts();
    if (result.success) {
      setAccounts(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedAccount(null);
      loadAccounts();
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setSelectedAccount(null);
      loadAccounts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">
            Manage your financial accounts
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-lg border bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No accounts yet. Create your first account to get started.
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AccountDialog
        account={selectedAccount}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <DeleteAccountDialog
        account={selectedAccount}
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
      />
    </div>
  );
}
