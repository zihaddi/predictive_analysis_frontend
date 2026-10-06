import { API_BASE_URL } from '$app/env/public';

type FetchApiOptions = RequestInit & {
	/** Bearer token for authenticated calls. */
	token?: string;
	/** Pass SvelteKit's `fetch` from load/actions so SSR and cookies work. */
	fetch?: typeof fetch;
};

/** Thin wrapper around fetch for the backend API. Throws on non-2xx. */
export async function fetchApi<T>(path: string, options: FetchApiOptions = {}): Promise<T> {
	const { token, fetch: f = fetch, headers, ...rest } = options;

	const res = await f(`${API_BASE_URL}${path}`, {
		...rest,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers
		}
	});

	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	return res.json() as Promise<T>;
}
