<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import type { Transaction } from '../app';

	interface Props {
		transactions: Transaction[];
	}

	let { transactions }: Props = $props();

	interface CategorySummary {
		category: string;
		count: number;
		total: number;
		percentage: number;
	}

	const categoryAnalytics = $derived(() => {
		const categoryMap = new Map<string, { count: number; total: number }>();
		let totalExpenses = 0;
		let totalIncome = 0;

		transactions.forEach((transaction) => {
			const category = transaction.category || 'Uncategorized';
			const existing = categoryMap.get(category) || { count: 0, total: 0 };

			categoryMap.set(category, {
				count: existing.count + 1,
				total: existing.total + transaction.amount
			});

			if (transaction.amount < 0) {
				totalExpenses += Math.abs(transaction.amount);
			} else {
				totalIncome += transaction.amount;
			}
		});

		const categories: CategorySummary[] = Array.from(categoryMap.entries())
			.map(([category, data]) => ({
				category,
				count: data.count,
				total: data.total,
				percentage: totalExpenses > 0 ? (Math.abs(data.total) / totalExpenses) * 100 : 0
			}))
			.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

		return {
			categories,
			totalExpenses,
			totalIncome,
			netIncome: totalIncome - totalExpenses,
			transactionCount: transactions.length
		};
	});

	const averageTransaction = $derived(() => {
		if (transactions.length === 0) return 0;
		const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
		return total / transactions.length;
	});

	const expenseTransactions = $derived(() => transactions.filter((t) => t.amount < 0));

	const incomeTransactions = $derived(() => transactions.filter((t) => t.amount > 0));
</script>

<div class="analytics-container">
	<h3>Analytics Overview</h3>

	<!-- Summary Cards -->
	<div class="summary-cards">
		<div class="card">
			<h4>Total Transactions</h4>
			<p class="value">{categoryAnalytics().transactionCount}</p>
		</div>

		<div class="card income">
			<h4>Total Income</h4>
			<p class="value">{formatCurrency(categoryAnalytics().totalIncome)}</p>
		</div>

		<div class="card expense">
			<h4>Total Expenses</h4>
			<p class="value">{formatCurrency(-categoryAnalytics().totalExpenses)}</p>
		</div>

		<div class="card {categoryAnalytics().netIncome >= 0 ? 'positive' : 'negative'}">
			<h4>Net Income</h4>
			<p class="value">{formatCurrency(categoryAnalytics().netIncome)}</p>
		</div>

		<div class="card">
			<h4>Average Transaction</h4>
			<p class="value">{formatCurrency(averageTransaction())}</p>
		</div>

		<div class="card">
			<h4>Expense Transactions</h4>
			<p class="value">{expenseTransactions.length}</p>
		</div>
	</div>

	<!-- Category Breakdown -->
	<div class="category-breakdown">
		<h4>Spending by Category</h4>

		{#if categoryAnalytics().categories.length > 0}
			<div class="category-list">
				{#each categoryAnalytics().categories as category}
					<div class="category-item">
						<div class="category-info">
							<span class="category-name">{category.category}</span>
							<span class="category-count">({category.count} transactions)</span>
						</div>
						<div class="category-amount">
							<span class="amount">{formatCurrency(category.total)}</span>
							{#if category.total < 0}
								<span class="percentage">({category.percentage.toFixed(1)}%)</span>
							{/if}
						</div>
						{#if category.total < 0}
							<div class="progress-bar">
								<div class="progress-fill" style="width: {category.percentage}%"></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="no-data">No categorized transactions found.</p>
		{/if}
	</div>
</div>

<style>
	.analytics-container {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		border: 1px solid #e9ecef;
	}

	.analytics-container h3 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.2rem;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.card {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #dee2e6;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #6c757d;
		font-weight: 500;
	}

	.card .value {
		margin: 0;
		font-size: 1.5rem;
		font-weight: bold;
		color: #495057;
	}

	.card.income .value {
		color: #28a745;
	}

	.card.expense .value {
		color: #dc3545;
	}

	.card.positive .value {
		color: #28a745;
	}

	.card.negative .value {
		color: #dc3545;
	}

	.category-breakdown h4 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	.category-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-item {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #dee2e6;
	}

	.category-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.category-name {
		font-weight: 500;
		color: #495057;
	}

	.category-count {
		font-size: 0.9rem;
		color: #6c757d;
	}

	.category-amount {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.amount {
		font-weight: bold;
		font-size: 1.1rem;
	}

	.percentage {
		font-size: 0.9rem;
		color: #6c757d;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e9ecef;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #dc3545, #c82333);
		transition: width 0.3s ease;
	}

	.no-data {
		text-align: center;
		color: #6c757d;
		font-style: italic;
		margin: 2rem 0;
	}

	@media (max-width: 768px) {
		.summary-cards {
			grid-template-columns: repeat(2, 1fr);
		}

		.category-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.category-amount {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
