'use client';

import { Category, CategoryWithParent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

interface CategoryNodeProps {
  category: Category;
  children: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  level?: number;
}

function CategoryNode({
  category,
  children,
  onEdit,
  onDelete,
  level = 0,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;

  // Get icon component
  const IconComponent = category.icon
    ? (Icons as any)[category.icon] || Icons.Wallet
    : Icons.Wallet;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: category.color || '#64748B' }}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1">
          <div className="font-medium">{category.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              children={[]}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ categories, onEdit, onDelete }: CategoryTreeProps) {
  // Build tree structure
  const rootCategories = categories.filter((cat) => !cat.parentId);
  const childrenMap = new Map<string, Category[]>();

  categories.forEach((cat) => {
    if (cat.parentId) {
      const children = childrenMap.get(cat.parentId) || [];
      children.push(cat);
      childrenMap.set(cat.parentId, children);
    }
  });

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No categories found. Create your first category to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rootCategories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          children={childrenMap.get(category.id) || []}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
