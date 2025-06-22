<script lang="ts">
	import { getAllCategories } from '$lib/category';
	import type { Transaction } from '../app';

	interface Props {
		transactions: Transaction[];
		onFilter: (filtered: Transaction[] | null) => void;
	}

	let { transactions, onFilter }: Props = $props();

	let selectedCategory = $state('');
	let startDate = $state('');
	let endDate = $state('');

	const categories = getAllCategories();

	$effect(() => {
		applyFilters();
	});

	const applyFilters = () => {
		let filtered = [...transactions];

		if (selectedCategory) {
			filtered = filtered.filter((t) => t.category === selectedCategory);
		}

		if (startDate || endDate) {
			filtered = filtered.filter((t) => {
				const transactionDate = new Date(t.date);
				const start = startDate ? new Date(startDate) : null;
				const end = endDate ? new Date(endDate) : null;

				if (start && end) {
					return transactionDate >= start && transactionDate <= end;
				} else if (start) {
					return transactionDate >= start;
				} else if (end) {
					return transactionDate <= end;
				}
				return true;
			});
		}

		if (!selectedCategory && !startDate && !endDate) {
			onFilter(null);
		} else {
			onFilter(filtered);
		}
	};

	const filterByCategory = (e: Event) => {
		selectedCategory = (e.target as HTMLSelectElement).value;
		applyFilters();
	};

	const filterByDate = () => {
		applyFilters();
	};

	const clearFilters = () => {
		selectedCategory = '';
		startDate = '';
		endDate = '';
		applyFilters();
	};
</script>

<div class="filters-container">
	<h3>Filters</h3>

	<div class="filters-grid">
		<div class="filter-group">
			<label for="category">Category:</label>
			<select id="category" value={selectedCategory} onchange={filterByCategory}>
				<option value="">All Categories</option>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="startDate">Start Date:</label>
			<input id="startDate" type="date" bind:value={startDate} onchange={filterByDate} />
		</div>

		<div class="filter-group">
			<label for="endDate">End Date:</label>
			<input id="endDate" type="date" bind:value={endDate} onchange={filterByDate} />
		</div>

		<div class="filter-actions">
			<button class="clear-btn" onclick={clearFilters}> Clear All Filters </button>
		</div>
	</div>
</div>

<style>
	.filters-container {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		border: 1px solid #e9ecef;
	}

	.filters-container h3 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #495057;
		font-size: 0.9rem;
	}

	.filter-group input,
	.filter-group select {
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}

	.filter-actions {
		display: flex;
		align-items: end;
	}

	.clear-btn {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.clear-btn:hover {
		background: #5a6268;
	}

	@media (max-width: 768px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
