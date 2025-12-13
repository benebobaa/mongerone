'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { updateProfile } from '@/lib/actions/profiles';
import { getCurrencies } from '@/lib/actions/currencies';
import { toast } from 'sonner';
import type { Profile, Currency } from '@/lib/types';

const preferencesSchema = z.object({
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  profile: Profile;
  onUpdate: () => void;
}

export function PreferencesForm({ profile, onUpdate }: PreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currencyCode: profile.currencyCode || 'USD',
    },
  });

  useEffect(() => {
    const loadCurrencies = async () => {
      const result = await getCurrencies();
      if (result.success) {
        setCurrencies(result.data);
      }
      setLoading(false);
    };
    loadCurrencies();
  }, []);

  useEffect(() => {
    form.reset({
      currencyCode: profile.currencyCode || 'USD',
    });
  }, [profile, form]);

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfile({
        currencyCode: data.currencyCode,
      });

      if (result.success) {
        toast.success('Preferences updated successfully');
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading currencies...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                This currency will be used for all your transactions and reports.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
