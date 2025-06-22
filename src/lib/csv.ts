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

export { parseCSV, exportToCSV }