import { m } from '#lib/paraglide/messages.js';
import type { FieldErrors } from '#lib/types/api.ts';

/** Thrown by `fetchApi` (browser/SSR) and `backendJson` (server) for every non-2xx response. */
export class ApiError extends Error {
	/** HTTP status. `0` = the request never reached the server (network down, timeout). */
	readonly status: number;
	/** Per-field validation messages (422). */
	readonly errors?: FieldErrors;

	constructor(message: string, status: number, errors?: FieldErrors) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}

	get isNetworkError() {
		return this.status === 0 || this.status === 502 || this.status === 504;
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

/** First validation message for a field, if any. */
export function fieldError(error: unknown, field: string): string | undefined {
	return isApiError(error) ? error.errors?.[field]?.[0] : undefined;
}

/**
 * User-facing message for any error: localized text for network/server failures,
 * the backend's own message otherwise.
 */
export function describeError(error: unknown, fallback = m.error_generic()): string {
	if (!isApiError(error)) return fallback;
	if (error.isNetworkError) return m.error_network();
	if (error.status >= 500) return fallback;
	const firstField = error.errors && Object.values(error.errors)[0]?.[0];
	return firstField ?? error.message ?? fallback;
}
