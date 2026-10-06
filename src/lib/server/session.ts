import type { Cookies } from '@sveltejs/kit';
import { backendRequest } from '#lib/server/backend.ts';
import type { AuthTokens } from '#lib/types/auth.ts';

/** Anything with `cookies` + `url` — a RequestEvent fits. */
export interface SessionContext {
	cookies: Cookies;
	url: URL;
}

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';
/** "Remember me" choice, so a rotated refresh token keeps the same persistence. */
const REMEMBER = 'auth_remember';

/** Seconds until a JWT expires (from its `exp` claim, not verified — only used for cookie lifetime). */
function secondsUntilExpiry(jwt: string, fallback: number) {
	try {
		const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		const { exp } = JSON.parse(atob(payload)) as { exp?: number };
		if (typeof exp === 'number') return Math.max(Math.floor(exp - Date.now() / 1000), 1);
	} catch {
		/* fall through */
	}
	return fallback;
}

export function setSession(
	{ cookies, url }: SessionContext,
	tokens: AuthTokens,
	remember: boolean
) {
	const base = {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		// Also works on http://<LAN-ip>:5173 during development
		secure: url.protocol === 'https:'
	};
	const refreshMaxAge = secondsUntilExpiry(tokens.refresh_token, 60 * 60 * 24 * 7);

	// Access cookie disappears exactly when the token expires, which is the cue to refresh.
	cookies.set(ACCESS, tokens.access_token, {
		...base,
		maxAge: secondsUntilExpiry(tokens.access_token, tokens.expires_in)
	});
	// Without "remember me" both cookies are session cookies (no maxAge).
	cookies.set(REFRESH, tokens.refresh_token, {
		...base,
		...(remember ? { maxAge: refreshMaxAge } : {})
	});
	cookies.set(REMEMBER, remember ? '1' : '0', {
		...base,
		...(remember ? { maxAge: refreshMaxAge } : {})
	});
}

export function clearSession({ cookies }: SessionContext) {
	for (const name of [ACCESS, REFRESH, REMEMBER]) cookies.delete(name, { path: '/' });
}

export function hasSession({ cookies }: SessionContext) {
	return Boolean(cookies.get(ACCESS) || cookies.get(REFRESH));
}

export function getRefreshToken({ cookies }: SessionContext) {
	return cookies.get(REFRESH) ?? null;
}

// The backend rotates refresh tokens: a used token is revoked immediately. Parallel requests that all
// find an expired access cookie would each try to rotate and all but one would fail, signing the user
// out. Share one in-flight refresh per token (and keep the result briefly for late arrivals).
const refreshes = new Map<string, Promise<AuthTokens | null>>();
const REFRESH_SHARE_MS = 10_000;

async function rotate(refreshToken: string): Promise<AuthTokens | null> {
	const response = await backendRequest('/auth/refresh', {
		method: 'POST',
		body: { refresh_token: refreshToken }
	});
	if (!response.ok) return null;
	const payload = (await response.json().catch(() => null)) as { data?: AuthTokens } | null;
	return payload?.data ?? null;
}

/** Rotates the session and returns a fresh access token, or null (and clears the cookies) if it can't. */
export async function refreshSession(ctx: SessionContext): Promise<string | null> {
	const refreshToken = getRefreshToken(ctx);
	if (!refreshToken) return null;

	let pending = refreshes.get(refreshToken);
	if (!pending) {
		pending = rotate(refreshToken).catch(() => null);
		refreshes.set(refreshToken, pending);
		setTimeout(() => refreshes.delete(refreshToken), REFRESH_SHARE_MS).unref?.();
	}

	const tokens = await pending;
	if (!tokens) {
		clearSession(ctx);
		return null;
	}
	setSession(ctx, tokens, ctx.cookies.get(REMEMBER) === '1');
	return tokens.access_token;
}

/**
 * Runs a backend call with the user's access token. Refreshes first if the access cookie has expired,
 * and once more (then retries) if the backend answers 401. Works for public endpoints too (token = null).
 */
export async function authorizedRequest(
	ctx: SessionContext,
	send: (token: string | null) => Promise<Response>
): Promise<Response> {
	let token = ctx.cookies.get(ACCESS) ?? null;
	if (!token && getRefreshToken(ctx)) token = await refreshSession(ctx);

	const response = await send(token);
	if (response.status === 401 && token && getRefreshToken(ctx)) {
		const fresh = await refreshSession(ctx);
		if (fresh) return send(fresh);
	}
	return response;
}
