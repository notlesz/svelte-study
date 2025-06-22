<script lang="ts">
	import type { Transaction } from '../app';
	import { suggestCategory } from '$lib/format';
	import TransactionTable from './Table.svelte';
	import Filters from './Filters.svelte';
	import Analytics from './Analytics.svelte';
	import CSVUploader from './CSVUploader.svelte';
	import type { Config } from '@sveltejs/adapter-vercel';

	export const config: Config = {
		runtime: 'edge'
	};

	let allTransactions = $state<Transaction[]>([]);
	let filteredTransactions = $state<Transaction[] | null>(null);
	let showAnalytics = $state(true);
	let showUploader = $state(false);

	const displayTransactions = $derived(() => {
		if (filteredTransactions === null) {
			return allTransactions;
		}
		return filteredTransactions;
	});

	const handleChangeTransactions = (nextTransactions: Transaction[]) => {
		allTransactions = nextTransactions;
	};

	const handleFilteredTransactions = (filtered: Transaction[] | null) => {
		filteredTransactions = filtered;
	};

	const handleImportTransactions = (importedTransactions: Transaction[]) => {
		const existingIds = new Set(allTransactions.map((t) => t.id));
		const newTransactions = importedTransactions.filter((t) => !existingIds.has(t.id));

		if (newTransactions.length > 0) {
			const mergedTransactions = [...allTransactions, ...newTransactions];
			handleChangeTransactions(mergedTransactions);
			showUploader = false;
		}
	};

	const getTransactions = async () => {
		try {
			const data = await fetch('/transactions.json');
			const transactions = (await data.json()) as Transaction[];
			handleChangeTransactions(transactions);
		} catch (error) {
			console.error('Failed to obtain transactions:', error);
		}
	};

	const toggleAnalytics = () => {
		showAnalytics = !showAnalytics;
	};

	const toggleUploader = () => {
		showUploader = !showUploader;
	};

	$effect(() => {
		getTransactions();
	});
</script>

<main class="main-container">
	<header class="app-header">
		<h1>💰 Transaction Manager</h1>
		<p class="app-description">Manage, categorize, and analyze your financial transactions with smart automation</p>

		<nav class="app-nav">
			<button class="nav-btn {showAnalytics ? 'active' : ''}" onclick={toggleAnalytics}>
				{showAnalytics ? 'Hide' : 'Show'} Analytics
			</button>
			<button class="nav-btn {showUploader ? 'active' : ''}" onclick={toggleUploader}>
				{showUploader ? 'Hide' : 'Show'} CSV Import
			</button>
		</nav>
	</header>

	{#if showUploader}
		<CSVUploader onImport={handleImportTransactions} />
	{/if}

	{#if allTransactions.length > 0}
		<Filters transactions={allTransactions} onFilter={handleFilteredTransactions} />

		{#if showAnalytics}
			<Analytics transactions={displayTransactions()} />
		{/if}

		<div class="table-section">
			<div class="section-header">
				<h2>
					Transactions
					{#if filteredTransactions && filteredTransactions.length !== displayTransactions().length}
						<span class="filter-indicator">
							({filteredTransactions.length} of {displayTransactions().length})
						</span>
					{:else}
						<span class="total-count">({displayTransactions.length} total)</span>
					{/if}
				</h2>
			</div>

			<TransactionTable data={displayTransactions()} {handleChangeTransactions} />
		</div>
	{:else}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading transactions...</p>
		</div>
	{/if}
</main>

<style>
	.main-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.app-header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem 0;
		border-bottom: 2px solid #e9ecef;
	}

	.app-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		color: #212529;
		font-weight: 700;
	}

	.app-description {
		margin: 0 0 1.5rem 0;
		font-size: 1.1rem;
		color: #6c757d;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.app-nav {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.nav-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid #007bff;
		background: white;
		color: #007bff;
		border-radius: 25px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.nav-btn:hover {
		background: #007bff;
		color: white;
		transform: translateY(-1px);
	}

	.nav-btn.active {
		background: #007bff;
		color: white;
	}

	.section-header {
		margin-bottom: 1rem;
	}

	.section-header h2 {
		margin: 0;
		color: #495057;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-indicator {
		background: #007bff;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.total-count {
		color: #6c757d;
		font-size: 0.9rem;
		font-weight: 400;
	}

	.table-section {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid #e9ecef;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e9ecef;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		margin: 0;
		color: #6c757d;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.main-container {
			padding: 0.5rem;
		}

		.app-header {
			padding: 1rem 0;
		}

		.app-header h1 {
			font-size: 2rem;
		}

		.app-description {
			font-size: 1rem;
		}

		.nav-btn {
			padding: 0.6rem 1.2rem;
			font-size: 0.8rem;
		}

		.section-header h2 {
			font-size: 1.2rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.table-section {
			padding: 1rem;
		}

		.loading-state {
			padding: 2rem 1rem;
		}
	}

	@media (max-width: 480px) {
		.app-nav {
			flex-direction: column;
			align-items: center;
		}

		.nav-btn {
			width: 200px;
		}
	}
</style>
