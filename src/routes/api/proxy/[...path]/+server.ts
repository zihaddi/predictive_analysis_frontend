import { json } from '@sveltejs/kit';
import { backendRequest } from '#lib/server/backend.ts';
import { authorizedRequest } from '#lib/server/session.ts';
import { ApiError } from '#lib/utils/apiError.ts';
import type { RequestHandler } from './$types';

/**
 * Same-origin gateway to the backend for `fetchApi()`.
 *  - attaches the httpOnly access token (and refreshes it on expiry) so JS never handles tokens;
 *  - forwards method, query string and JSON body untouched; the backend stays the source of truth;
 *  - refuses endpoints that return tokens — those are handled server-side (lib/server/auth.ts).
 */
const SERVER_ONLY = new Set(['auth/login', 'auth/register', 'auth/refresh', 'auth/logout']);

const handler: RequestHandler = async (event) => {
	const segments = event.params.path.split('/').filter(Boolean);
	const path = segments.join('/');

	if (
		!path ||
		segments.some((s) => s === '.' || s === '..') ||
		SERVER_ONLY.has(path.toLowerCase())
	) {
		return json({ success: false, message: 'Not found' }, { status: 404 });
	}

	const { method } = event.request;
	const body = method === 'GET' || method === 'HEAD' ? undefined : await event.request.text();
	const contentType = event.request.headers.get('content-type');

	try {
		const response = await authorizedRequest(event, (token) =>
			backendRequest(`/${path}`, {
				method,
				token,
				body: body || undefined,
				query: event.url.searchParams,
				headers: contentType ? { 'Content-Type': contentType } : undefined
			})
		);

		return new Response(await response.text(), {
			status: response.status,
			headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' }
		});
	} catch (error) {
		const status = error instanceof ApiError && error.status === 0 ? 502 : 500;
		return json({ success: false, message: 'Backend unreachable' }, { status });
	}
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
