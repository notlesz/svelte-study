<script lang="ts">
	import type { Transaction } from '../app';
	import { formatCurrency, formatDate } from '$lib/format';
	import { suggestCategory, getAllCategories } from '$lib/category';
	import { exportToCSV } from '$lib/csv';

	interface Props {
		data: Transaction[];
		handleChangeTransactions: (data: Transaction[]) => void;
	}

	type SortValue = 'asc' | 'desc';

	interface Sort {
		amount: SortValue | null;
		category: SortValue | null;
		date: SortValue | null;
	}

	let { data, handleChangeTransactions }: Props = $props();

	let sort = $state<Sort>({
		amount: null,
		category: null,
		date: null
	});

	let selectedTransactions = $state<Set<string>>(new Set());
	let dismissedSuggestions = $state<Set<string>>(new Set());

	const categories = ['', ...getAllCategories()];
	const amount = $derived(data.reduce((acc, curr) => acc + curr.amount, 0));
	const hasCategory = $derived(data.find(({ category }) => !!category));
	const hasOrderedData = $derived(!!sort.amount || !!sort.category || !!sort.date);

	const checkIsPositiveBalance = (value: number) => (value < 0 ? 'debit' : 'deposit');

	const sortData = (type: keyof Sort, direction: SortValue) => {
		let sortedData = [...data];

		switch (type) {
			case 'amount':
				sortedData.sort((a, b) => (direction === 'asc' ? a.amount - b.amount : b.amount - a.amount));
				break;
			case 'date':
				sortedData.sort((a, b) =>
					direction === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime()
				);
				break;
			case 'category':
				sortedData.sort((a, b) => {
					const catA = a.category?.toLowerCase() || '';
					const catB = b.category?.toLowerCase() || '';
					const result = catA.localeCompare(catB);
					return direction === 'asc' ? result : -result;
				});
				break;
		}

		handleChangeTransactions(sortedData);
	};

	const handleSort = (type: keyof Sort) => () => {
		const currentSort = sort[type];
		const nextSort = currentSort ? (currentSort === 'asc' ? 'desc' : 'asc') : 'desc';

		if (type === 'category' && !hasCategory) return;

		sort = {
			...sort,
			[type]: nextSort
		};

		sortData(type, nextSort);
	};

	const getSortIcon = (type: keyof Sort) => {
		const currentSort = sort[type];
		if (currentSort) {
			return sort[type] === 'asc' ? '↑' : '↓';
		}
		return '';
	};

	const handleClearSort = () => {
		sort = {
			amount: null,
			category: null,
			date: null
		};

		const resetData = [...data].sort((a, b) => {
			return new Date(a.date).getTime() - new Date(b.date).getTime();
		});

		handleChangeTransactions(resetData);
	};

	const updateTransactionCategory = (transactionId: string, category: string) => {
		const updatedData = data.map((transaction) =>
			transaction.id === transactionId ? { ...transaction, category: category || undefined, categorySuggested: false } : transaction
		);
		handleChangeTransactions(updatedData);
	};

	const toggleTransactionSelection = (transactionId: string) => {
		if (selectedTransactions.has(transactionId)) {
			selectedTransactions.delete(transactionId);
		} else {
			selectedTransactions.add(transactionId);
		}
		selectedTransactions = new Set(selectedTransactions);
	};

	const selectAllTransactions = () => {
		if (selectedTransactions.size === data.length) {
			selectedTransactions = new Set();
		} else {
			selectedTransactions = new Set(data.map((t) => t.id));
		}
	};

	const applyCategoryToSelected = (category: string) => {
		const updatedData = data.map((transaction) =>
			selectedTransactions.has(transaction.id) ? { ...transaction, category: category || undefined, categorySuggested: false } : transaction
		);
		handleChangeTransactions(updatedData);
		selectedTransactions.clear();
	};

	const autoCategorizeSuggestions = () => {
		const updatedData = data.map((transaction) => {
			if (!transaction.category && !dismissedSuggestions.has(transaction.id)) {
				const suggested = suggestCategory(transaction.description);
				return suggested ? { ...transaction, category: suggested, categorySuggested: false } : transaction;
			}
			return transaction;
		});
		handleChangeTransactions(updatedData);
	};

	const exportTransactions = () => {
		exportToCSV(data as unknown as Record<string, string | number | undefined>[], `transactions-${new Date().toISOString().split('T')[0]}.csv`);
	};

	const dismissSuggestion = (transactionId: string) => {
		dismissedSuggestions.add(transactionId);
		dismissedSuggestions = new Set(dismissedSuggestions);
	};

	const uncategorizedCount = $derived(data.filter((t) => !t.category).length);
	const suggestionsAvailable = $derived(data.some((t) => !t.category && suggestCategory(t.description) && !dismissedSuggestions.has(t.id)));
</script>

<section>
	<div class="table-header">
		<div class="table-actions">
			{#if hasOrderedData}
				<button class="action-btn secondary" onclick={handleClearSort}>Clear Sort</button>
			{/if}

			{#if selectedTransactions.size > 0}
				<div class="bulk-actions">
					<span class="selection-info">{selectedTransactions.size} selected</span>
					<select onchange={(e) => applyCategoryToSelected(e.currentTarget.value)} class="bulk-category-select">
						<option value="">Apply category...</option>
						{#each categories.slice(1) as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
			{/if}

			{#if suggestionsAvailable}
				<button class="action-btn primary" onclick={autoCategorizeSuggestions}>
					Auto-Categorize ({uncategorizedCount} items)
				</button>
			{/if}

			<button class="action-btn secondary" onclick={exportTransactions}> Export CSV </button>
		</div>
	</div>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th class="checkbox-column">
						<input type="checkbox" checked={selectedTransactions.size === data.length && data.length > 0} onchange={selectAllTransactions} />
					</th>
					<th>Description</th>
					<th class="clicked-header" onclick={handleSort('date')}>
						Date {getSortIcon('date')}
					</th>
					<th class="clicked-header" onclick={handleSort('category')}>
						Category {getSortIcon('category')}
					</th>
					<th class="clicked-header" onclick={handleSort('amount')}>
						Amount {getSortIcon('amount')}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each data as item}
					<tr class:selected={selectedTransactions.has(item.id)}>
						<td>
							<input type="checkbox" checked={selectedTransactions.has(item.id)} onchange={() => toggleTransactionSelection(item.id)} />
						</td>
						<td class="description-cell">
							<div class="description">{item.description}</div>
						</td>
						<td>{formatDate(item.date)}</td>
						<td class="category-cell">
							<div class="category-container">
								<select
									value={item.category || ''}
									onchange={(e) => updateTransactionCategory(item.id, e.currentTarget.value)}
									class="category-select"
								>
									{#each categories as category}
										<option value={category}>
											{category || 'Select category...'}
										</option>
									{/each}
								</select>

								{#if !item.category && !dismissedSuggestions.has(item.id)}
									{@const testSuggestion = suggestCategory(item.description)}
									{#if testSuggestion}
										<div class="suggestion-tooltip">
											Suggested: <strong>{testSuggestion}</strong>
										</div>
										<div class="suggestion-actions">
											<button
												class="suggestion-btn accept"
												onclick={() => updateTransactionCategory(item.id, testSuggestion)}
												title="Accept suggestion: {testSuggestion}"
											>
												✓
											</button>
											<button class="suggestion-btn reject" onclick={() => dismissSuggestion(item.id)} title="Dismiss suggestion"> ✕ </button>
										</div>
									{/if}
								{/if}
							</div>
						</td>
						<td class={checkIsPositiveBalance(item.amount)}>
							{formatCurrency(item.amount)}
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<th scope="row" colspan="4">Total Amount</th>
					<td class={checkIsPositiveBalance(amount)}>{formatCurrency(amount)}</td>
				</tr>
				<tr>
					<th scope="row" colspan="4">Transaction Count</th>
					<td>{data.length}</td>
				</tr>
			</tfoot>
		</table>
	</div>
</section>

<style>
	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.table-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.action-btn.primary {
		background: #007bff;
		color: white;
	}

	.action-btn.primary:hover {
		background: #0056b3;
	}

	.action-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.action-btn.secondary:hover {
		background: #5a6268;
	}

	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #e3f2fd;
		border-radius: 4px;
		border: 1px solid #2196f3;
	}

	.selection-info {
		font-size: 0.9rem;
		color: #1976d2;
		font-weight: 500;
	}

	.bulk-category-select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 0.9rem;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		border-collapse: collapse;
		border: 2px solid rgb(140 140 140);
		font-family: sans-serif;
		font-size: 0.8rem;
		width: 100%;
		letter-spacing: 1px;
		min-width: 800px;
	}

	thead {
		background-color: rgb(228 240 245);
	}

	thead,
	th,
	td {
		border: 1px solid rgb(160 160 160);
		padding: 8px 10px;
	}

	td {
		text-align: center;
	}

	tbody > tr:nth-of-type(even) {
		background-color: rgb(237 238 242);
	}

	tbody > tr.selected {
		background-color: #e3f2fd !important;
	}

	.checkbox-column {
		width: 40px;
	}

	.description-cell {
		text-align: left !important;
		max-width: 300px;
	}

	.description {
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.suggestion {
		font-size: 0.8rem;
		color: #28a745;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.apply-suggestion {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		cursor: pointer;
		font-size: 0.7rem;
	}

	.apply-suggestion:hover {
		background: #218838;
	}

	.category-cell {
		width: 220px;
	}

	.category-container {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.category-select {
		width: 100%;
		padding: 0.3rem;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 0.8rem;
	}

	.suggestion-actions {
		display: flex;
		gap: 0.2rem;
		justify-content: center;
	}

	.suggestion-btn {
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.suggestion-btn.accept {
		background: #28a745;
		color: white;
	}

	.suggestion-btn.accept:hover {
		background: #218838;
		transform: scale(1.1);
	}

	.suggestion-btn.reject {
		background: #dc3545;
		color: white;
	}

	.suggestion-btn.reject:hover {
		background: #c82333;
		transform: scale(1.1);
	}

	.suggestion-tooltip {
		font-size: 0.7rem;
		color: #28a745;
		text-align: center;
		padding: 0.2rem;
		background: #f8f9fa;
		border-radius: 3px;
		border: 1px solid #e9ecef;
	}

	.debit {
		background-color: rgb(202, 18, 18);
		color: white;
		font-weight: bold;
	}

	.deposit {
		background-color: green;
		color: white;
		font-weight: bold;
	}

	.clicked-header {
		cursor: pointer;
		user-select: none;
	}

	.clicked-header:hover {
		background-color: rgb(200 220 235);
	}

	@media (max-width: 768px) {
		.table-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.bulk-actions {
			flex-direction: column;
			align-items: stretch;
			gap: 0.25rem;
		}

		table {
			font-size: 0.7rem;
			min-width: 600px;
		}

		.description-cell {
			max-width: 200px;
		}

		th,
		td {
			padding: 6px 8px;
		}
	}
</style>
