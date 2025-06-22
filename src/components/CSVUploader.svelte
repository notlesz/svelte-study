<script lang="ts">
	import { parseCSV } from '$lib/csv';
	import type { Transaction } from '../app';

	interface Props {
		onImport: (transactions: Transaction[]) => void;
	}

	let { onImport }: Props = $props();

	let fileInput: HTMLInputElement;
	let isDragOver = $state(false);
	let isProcessing = $state(false);
	let error = $state('');
	let previewData: Transaction[] = $state([]);
	let showPreview = $state(false);

	const handleFileSelect = (file: File) => {
		if (!file) return;

		if (!file.name.toLowerCase().endsWith('.csv')) {
			error = 'Please select a CSV file';
			return;
		}

		error = '';
		isProcessing = true;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const csvText = e.target?.result as string;
				const parsedData = parseCSV(csvText);

				const transactions: Transaction[] = parsedData.map((row, index) => {
					const transaction: Transaction = {
						id: (row.id as string) || `imported_${Date.now()}_${index}`,
						date: (row.date as string) || new Date().toISOString().split('T')[0],
						description: (row.description as string) || 'Imported transaction',
						amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount as string) || 0,
						category: (row.category as string) || undefined
					};

					if (!transaction.date || !transaction.description) {
						throw new Error(`Invalid data in row ${index + 1}: missing required fields`);
					}

					return transaction;
				});

				previewData = transactions.slice(0, 10);
				showPreview = true;
				isProcessing = false;
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to parse CSV file';
				isProcessing = false;
			}
		};

		reader.onerror = () => {
			error = 'Failed to read file';
			isProcessing = false;
		};

		reader.readAsText(file);
	};

	const handleFileInputChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();
		isDragOver = false;

		const file = event.dataTransfer?.files[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		isDragOver = true;
	};

	const handleDragLeave = () => {
		isDragOver = false;
	};

	const confirmImport = () => {
		// Re-parse the full file for import
		const fileToProcess = fileInput.files?.[0];
		if (!fileToProcess) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const csvText = e.target?.result as string;
				const parsedData = parseCSV(csvText);

				const transactions: Transaction[] = parsedData.map((row, index) => ({
					id: (row.id as string) || `imported_${Date.now()}_${index}`,
					date: (row.date as string) || new Date().toISOString().split('T')[0],
					description: (row.description as string) || 'Imported transaction',
					amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount as string) || 0,
					category: (row.category as string) || undefined
				}));

				onImport(transactions);
				resetUploader();
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to import transactions';
			}
		};

		reader.readAsText(fileToProcess);
	};

	const resetUploader = () => {
		if (fileInput) {
			fileInput.value = '';
		}
		previewData = [];
		showPreview = false;
		error = '';
		isProcessing = false;
	};

	const downloadSampleCSV = () => {
		const sampleData = [
			['id', 'date', 'description', 'amount', 'category'],
			['1', '2024-01-01', 'SAMPLE TRANSACTION', '-25.50', 'Groceries'],
			['2', '2024-01-02', 'PAYCHECK DEPOSIT', '2500.00', 'Income'],
			['3', '2024-01-03', 'COFFEE SHOP PURCHASE', '-4.75', 'Coffee']
		];

		const csvContent = sampleData.map((row) => row.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'sample-transactions.csv';
		link.click();
		URL.revokeObjectURL(url);
	};
</script>

<div class="csv-uploader">
	<h3>Import Transactions from CSV</h3>

	<div class="upload-section">
		<div
			class="drop-zone"
			class:drag-over={isDragOver}
			class:processing={isProcessing}
			role="button"
			tabindex="0"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
		>
			{#if isProcessing}
				<div class="processing">
					<div class="spinner"></div>
					<p>Processing file...</p>
				</div>
			{:else}
				<div class="drop-content">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7,10 12,15 17,10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
					<p><strong>Drop CSV file here</strong> or click to browse</p>
					<p class="file-requirements">Supported format: CSV with columns: id, date, description, amount, category</p>
				</div>
			{/if}

			<input bind:this={fileInput} type="file" accept=".csv" onchange={handleFileInputChange} style="display: none" />
		</div>

		<div class="upload-actions">
			<button class="upload-btn" onclick={() => fileInput?.click()} disabled={isProcessing}> Select CSV File </button>

			<button class="sample-btn" onclick={downloadSampleCSV}> Download Sample CSV </button>
		</div>
	</div>

	{#if error}
		<div class="error-message">
			<strong>Error:</strong>
			{error}
			<button class="close-error" onclick={() => (error = '')}>×</button>
		</div>
	{/if}

	{#if showPreview}
		<div class="preview-section">
			<h4>Preview (First 10 rows)</h4>
			<div class="preview-table-container">
				<table class="preview-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Date</th>
							<th>Description</th>
							<th>Amount</th>
							<th>Category</th>
						</tr>
					</thead>
					<tbody>
						{#each previewData as transaction}
							<tr>
								<td>{transaction.id}</td>
								<td>{transaction.date}</td>
								<td>{transaction.description}</td>
								<td class={transaction.amount < 0 ? 'negative' : 'positive'}>
									${Math.abs(transaction.amount).toFixed(2)}
								</td>
								<td>{transaction.category || 'Uncategorized'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="preview-actions">
				<button class="confirm-btn" onclick={confirmImport}> Import All Transactions </button>
				<button class="cancel-btn" onclick={resetUploader}> Cancel </button>
			</div>
		</div>
	{/if}
</div>

<style>
	.csv-uploader {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		margin-bottom: 1rem;
	}

	.csv-uploader h3 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.2rem;
	}

	.upload-section {
		margin-bottom: 1rem;
	}

	.drop-zone {
		border: 2px dashed #ced4da;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		background: white;
		margin-bottom: 1rem;
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: #007bff;
		background: #f8f9ff;
	}

	.drop-zone.processing {
		border-color: #28a745;
		background: #f8fff8;
		cursor: not-allowed;
	}

	.drop-content svg {
		color: #6c757d;
		margin-bottom: 1rem;
	}

	.drop-content p {
		margin: 0.5rem 0;
		color: #495057;
	}

	.file-requirements {
		font-size: 0.9rem;
		color: #6c757d !important;
		font-style: italic;
	}

	.processing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e9ecef;
		border-top: 3px solid #28a745;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.upload-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.upload-btn,
	.sample-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.upload-btn {
		background: #007bff;
		color: white;
	}

	.upload-btn:hover:not(:disabled) {
		background: #0056b3;
	}

	.upload-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.sample-btn {
		background: #6c757d;
		color: white;
	}

	.sample-btn:hover {
		background: #5a6268;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem;
		border-radius: 4px;
		border: 1px solid #f5c6cb;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-error {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #721c24;
	}

	.preview-section {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #dee2e6;
	}

	.preview-section h4 {
		margin: 0 0 1rem 0;
		color: #495057;
	}

	.preview-table-container {
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		min-width: 600px;
	}

	.preview-table th,
	.preview-table td {
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		text-align: left;
	}

	.preview-table th {
		background: #e9ecef;
		font-weight: 500;
	}

	.preview-table td.negative {
		color: #dc3545;
	}

	.preview-table td.positive {
		color: #28a745;
	}

	.preview-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.confirm-btn,
	.cancel-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.confirm-btn {
		background: #28a745;
		color: white;
	}

	.confirm-btn:hover {
		background: #218838;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
	}

	.cancel-btn:hover {
		background: #5a6268;
	}

	@media (max-width: 768px) {
		.upload-actions,
		.preview-actions {
			flex-direction: column;
		}

		.drop-zone {
			padding: 1rem;
		}

		.preview-table {
			font-size: 0.8rem;
			min-width: 500px;
		}
	}
</style>
