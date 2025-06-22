const formatDate = (date: string) => {
	return new Intl.DateTimeFormat('en-US').format(new Date(date));
};

const formatCurrency = (number: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(number);
};


export { formatCurrency, formatDate };
