import { browser } from '$app/env';
import type { ApiEnvelope } from '#lib/types/api.ts';
import { ApiError } from '#lib/utils/apiError.ts';

/**
 * Same-origin proxy to the backend (src/routes/api/proxy/[...path]/+server.ts).
 * The proxy attaches the httpOnly access token and refreshes it when needed,
 * so the browser never sees a token and this helper works identically in components and `load`.
 */
export const API_PROXY_PATH = '/api/proxy';

type Query = Record<string, string | number | boolean | null | undefined>;

export interface FetchApiOptions extends Omit<RequestInit, 'body'> {
	/** JSON body; objects are stringified for you. */
	body?: unknown;
	query?: Query;
	/**
	 * SvelteKit's `fetch` from `load` / actions / hooks. REQUIRED on the server so that
	 * the relative proxy URL resolves and the user's cookies are forwarded.
	 */
	fetch?: typeof fetch;
}

function toQueryString(query?: Query) {
	if (!query) return '';
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
	}
	const text = params.toString();
	return text ? `?${text}` : '';
}

/**
 * Call a backend endpoint (path relative to the API prefix, e.g. `/auth/me`).
 * Resolves with the response envelope, throws `ApiError` otherwise.
 *
 * @example
 *   const res = await fetchApi<User>('/auth/me', { fetch });
 *   res.data // User
 */
export async function fetchApi<T = unknown>(
	path: string,
	options: FetchApiOptions = {}
): Promise<ApiEnvelope<T>> {
	const { fetch: f = fetch, body, query, headers, ...rest } = options;

	let response: Response;
	try {
		response = await f(`${API_PROXY_PATH}${path}${toQueryString(query)}`, {
			...rest,
			headers: {
				Accept: 'application/json',
				...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
				...headers
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	} catch {
		throw new ApiError('Network error', 0);
	}

	const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

	if (!response.ok) {
		// Proxy already tried to refresh the session; a 401 here means the user is signed out.
		if (browser && response.status === 401) window.location.assign('/login');
		throw new ApiError(
			payload?.message ?? (response.statusText || 'Request failed'),
			response.status,
			payload?.errors
		);
	}

	return payload ?? { success: true, message: '' };
}
