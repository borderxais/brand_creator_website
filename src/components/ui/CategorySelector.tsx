'use client';

import { Category, CATEGORY_LABELS } from '@/types/category';

interface CategorySelectorProps {
  selectedCategories: Category[];
  onChange: (categories: Category[]) => void;
  maxCategories?: number;
}

export function CategorySelector({
  selectedCategories,
  onChange,
  maxCategories = 5
}: CategorySelectorProps) {
  const handleToggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < maxCategories) {
      onChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
        const isSelected = selectedCategories.includes(category as Category);
        return (
          <div
            key={category}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              isSelected
                ? 'bg-purple-100 border-purple-500'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${selectedCategories.length >= maxCategories && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!(selectedCategories.length >= maxCategories && !isSelected)) {
                handleToggleCategory(category as Category);
              }
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                disabled={selectedCategories.length >= maxCategories && !isSelected}
              />
              <span className="text-sm font-medium text-gray-900">{label}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
