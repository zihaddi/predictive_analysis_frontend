import { API_BASE_URL, API_PREFIX } from '$app/env/private';
import type { ApiEnvelope } from '#lib/types/api.ts';
import { ApiError } from '#lib/utils/apiError.ts';

const REQUEST_TIMEOUT_MS = 15_000;

export interface BackendRequestOptions {
	method?: string;
	token?: string | null;
	/** Objects are JSON-encoded; strings are sent as they are (used by the proxy). */
	body?: unknown;
	query?: URLSearchParams | Record<string, string>;
	headers?: Record<string, string>;
}

/**
 * Low-level call to the backend (server-side only). `path` is relative to API_PREFIX, e.g. `/auth/me`.
 * Throws `ApiError(status 0)` when the backend can't be reached.
 */
export async function backendRequest(
	path: string,
	{ method = 'GET', token, body, query, headers }: BackendRequestOptions = {}
): Promise<Response> {
	const search = query ? new URLSearchParams(query).toString() : '';
	const url = `${API_BASE_URL}${API_PREFIX}${path}${search ? `?${search}` : ''}`;
	const hasBody = body !== undefined;

	try {
		return await fetch(url, {
			method,
			headers: {
				Accept: 'application/json',
				...(hasBody ? { 'Content-Type': 'application/json' } : {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...headers
			},
			body: !hasBody ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});
	} catch {
		throw new ApiError('Backend unreachable', 0);
	}
}

/** Same as `backendRequest` but parses the envelope and throws `ApiError` for non-2xx. */
export async function backendJson<T>(
	path: string,
	options?: BackendRequestOptions
): Promise<ApiEnvelope<T>> {
	const response = await backendRequest(path, options);
	const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

	if (!response.ok) {
		throw new ApiError(payload?.message ?? response.statusText, response.status, payload?.errors);
	}
	return payload ?? { success: true, message: '' };
}
