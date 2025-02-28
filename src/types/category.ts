export type Category = 
  | 'FASHION'
  | 'BEAUTY'
  | 'LIFESTYLE'
  | 'FOOD'
  | 'TRAVEL'
  | 'FITNESS'
  | 'TECH'
  | 'GAMING'
  | 'OTHERS';

export const CATEGORIES: Category[] = [
  'FASHION',
  'BEAUTY',
  'LIFESTYLE',
  'FOOD',
  'TRAVEL',
  'FITNESS',
  'TECH',
  'GAMING',
  'OTHERS'
];

export const CATEGORY_LABELS: Record<Category, string> = {
  FASHION: 'Fashion',
  BEAUTY: 'Beauty',
  LIFESTYLE: 'Lifestyle',
  FOOD: 'Food',
  TRAVEL: 'Travel',
  FITNESS: 'Fitness',
  TECH: 'Tech',
  GAMING: 'Gaming',
  OTHERS: 'Others'
};

// Helper function to check if a string is a valid category
export function isCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}

// Helper function to format category for display
export function formatCategory(category: Category): string {
  return CATEGORY_LABELS[category];
}
