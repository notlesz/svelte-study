// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	category?: string;
	categorySuggested?: boolean;
}

export { Transaction };
