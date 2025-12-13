'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
  '#64748B', // slate
];

interface CategoryColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value || PRESET_COLORS[0]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-2">
      <Label>Color</Label>
      <div className="grid grid-cols-9 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`h-8 w-8 rounded-md border-2 transition-all hover:scale-110 ${
              selectedColor === color
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div
          className="h-10 w-10 rounded-md border"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm text-muted-foreground font-mono">
          {selectedColor}
        </span>
      </div>
    </div>
  );
}
