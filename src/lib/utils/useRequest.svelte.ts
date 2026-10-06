import { ApiError, isApiError } from '#lib/utils/apiError.ts';

/**
 * Reactive request state — the Svelte version of the Nuxt pattern:
 *
 *   const isLoading = ref(false); const data = ref(null); const error = ref(null)
 *   const loadData = async () => { isLoading = true; error = null; try { data = await $fetch… } catch … finally … }
 *
 * @example
 *   const users = useRequest((page: number) => adminApi.listUsers({ page }));
 *   users.execute(1);
 *   {#if users.isLoading} … {:else if users.error} {users.error.message} {:else} {users.data?.items} {/if}
 */
export function useRequest<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
	let isLoading = $state(false);
	let data = $state.raw<T | null>(null);
	let error = $state.raw<ApiError | null>(null);
	// Ignore results of superseded calls (fast pagination, double clicks).
	let latest = 0;

	async function execute(...args: Args): Promise<T | null> {
		const id = ++latest;
		isLoading = true;
		error = null;

		try {
			const result = await fn(...args);
			if (id === latest) data = result;
			return result;
		} catch (err) {
			if (id === latest) error = isApiError(err) ? err : new ApiError(String(err), 0);
			return null;
		} finally {
			if (id === latest) isLoading = false;
		}
	}

	function reset() {
		latest++;
		isLoading = false;
		data = null;
		error = null;
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		execute,
		reset
	};
}
