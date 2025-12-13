'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';

// Common category icons
const COMMON_ICONS = [
  'Wallet',
  'DollarSign',
  'CreditCard',
  'ShoppingCart',
  'Home',
  'Car',
  'Utensils',
  'Coffee',
  'ShoppingBag',
  'Plane',
  'Heart',
  'Gift',
  'Briefcase',
  'GraduationCap',
  'Music',
  'Film',
  'Gamepad2',
  'TrendingUp',
  'TrendingDown',
  'PiggyBank',
  'Landmark',
  'Smartphone',
  'Zap',
  'Droplet',
  'Wifi',
  'Pill',
  'Stethoscope',
  'Dumbbell',
  'Book',
  'Laptop',
  'Monitor',
  'Shirt',
  'Package',
];

interface CategoryIconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(value || 'Wallet');

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    onChange(iconName);
    setOpen(false);
  };

  // Get the icon component
  const SelectedIconComponent = (Icons as any)[selectedIcon] || Icons.Wallet;

  // Filter icons based on search
  const filteredIcons = COMMON_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <SelectedIconComponent className="h-4 w-4" />
              <span>{selectedIcon}</span>
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search icons..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No icons found.</CommandEmpty>
              <CommandGroup>
                <div className="grid grid-cols-6 gap-2 p-2">
                  {filteredIcons.map((iconName) => {
                    const IconComponent = (Icons as any)[iconName];
                    if (!IconComponent) return null;

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleIconSelect(iconName)}
                        className={`flex items-center justify-center h-12 w-12 rounded-md border transition-all hover:bg-accent ${
                          selectedIcon === iconName
                            ? 'bg-accent border-primary'
                            : ''
                        }`}
                        title={iconName}
                      >
                        <IconComponent className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
