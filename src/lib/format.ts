const formatDate = (date: string) => {
	return new Intl.DateTimeFormat('en-US').format(new Date(date));
};

const formatCurrency = (number: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(number);
};

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

const exportToCSV = (data: Record<string, string | number | undefined>[], filename: string = 'transactions.csv') => {
	if (!data.length) return;

	const headers = Object.keys(data[0]);
	const csvContent = [
		headers.join(','),
		...data.map((row) =>
			headers
				.map((header) => {
					const value = row[header];
					return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
				})
				.join(',')
		)
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
};

const parseCSV = (csvText: string): Record<string, unknown>[] => {
	const lines = csvText.split('\n').filter((line) => line.trim());
	if (lines.length < 2) return [];

	const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
	const data: Record<string, unknown>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
		const row: Record<string, unknown> = {};

		headers.forEach((header, index) => {
			let value: string | number = values[index] || '';

			if (header === 'amount' && !isNaN(Number(value))) {
				value = Number(value);
			}

			row[header] = value;
		});

		if (!row.id) {
			row.id = `imported_${Date.now()}_${i}`;
		}

		data.push(row);
	}

	return data;
};

export { formatCurrency, formatDate, suggestCategory, getAllCategories, exportToCSV, parseCSV };
