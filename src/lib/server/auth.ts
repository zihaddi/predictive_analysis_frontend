import { backendJson, backendRequest } from '#lib/server/backend.ts';
import {
	authorizedRequest,
	clearSession,
	getRefreshToken,
	hasSession,
	setSession,
	type SessionContext
} from '#lib/server/session.ts';
import type { AuthTokens, User } from '#lib/types/auth.ts';

/** POST /auth/login → stores the tokens in httpOnly cookies and returns the user. Throws ApiError. */
export async function login(
	ctx: SessionContext,
	input: { email: string; password: string; remember: boolean }
): Promise<User> {
	const { data } = await backendJson<{ user: User; tokens: AuthTokens }>('/auth/login', {
		method: 'POST',
		body: { email: input.email, password: input.password }
	});
	setSession(ctx, data!.tokens, input.remember);
	return data!.user;
}

/** POST /auth/logout (revokes the refresh token) and clears the session. Never throws. */
export async function logout(ctx: SessionContext) {
	const refreshToken = getRefreshToken(ctx);
	if (refreshToken) {
		await backendRequest('/auth/logout', {
			method: 'POST',
			body: { refresh_token: refreshToken }
		}).catch(() => undefined);
	}
	clearSession(ctx);
}

/** Current user from GET /auth/me, or null for guests / dead sessions. Refreshes tokens transparently. */
export async function loadUser(ctx: SessionContext): Promise<User | null> {
	if (!hasSession(ctx)) return null;

	try {
		const response = await authorizedRequest(ctx, (token) => backendRequest('/auth/me', { token }));
		if (!response.ok) {
			if (response.status === 401) clearSession(ctx);
			return null;
		}
		const payload = (await response.json()) as { data?: User };
		return payload.data ?? null;
	} catch {
		// Backend down: treat as signed-out for this request but keep the cookies for when it's back.
		return null;
	}
}
