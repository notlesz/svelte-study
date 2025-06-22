const CATEGORY_MAPPING: Record<string, string> = {
  STARBUCKS: 'Coffee',
  'COFFEE BEAN': 'Coffee',
  'DUNKIN DONUTS': 'Coffee',
  'WHOLE FOODS': 'Groceries',
  SAFEWAY: 'Groceries',
  'TRADER JOES': 'Groceries',
  KROGER: 'Groceries',
  COSTCO: 'Groceries',
  TARGET: 'Shopping',
  AMAZON: 'Shopping',
  'BEST BUY': 'Electronics',
  'HOME DEPOT': 'Home & Garden',
  SHELL: 'Gas',
  CHEVRON: 'Gas',
  UBER: 'Transportation',
  LYFT: 'Transportation',
  NETFLIX: 'Entertainment',
  SPOTIFY: 'Entertainment',
  ADOBE: 'Software',
  STEAM: 'Entertainment',
  MCDONALDS: 'Fast Food',
  CHIPOTLE: 'Fast Food',
  DOMINOS: 'Fast Food',
  'UBER EATS': 'Food Delivery',
  CVS: 'Health & Pharmacy',
  VERIZON: 'Utilities',
  'ELECTRIC BILL': 'Utilities',
  RENT: 'Housing',
  SALARY: 'Income',
  PAYPAL: 'Transfer',
  FLOWERS: 'Gifts'
};

const suggestCategory = (description: string): string | null => {
  const upperDesc = description.toUpperCase();

  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (upperDesc.includes(keyword)) {
      return category;
    }
  }

  return null;
};

const getAllCategories = (): string[] => {
  const categories = new Set(Object.values(CATEGORY_MAPPING));
  return Array.from(categories).sort();
};

export { getAllCategories, suggestCategory }