import type { User } from '#lib/types/auth.ts';
import { fetchApi } from '#lib/utils/fetchApi.ts';

/** Pass SvelteKit's `fetch` when calling from `load` / actions. */
export interface ApiOptions {
	fetch?: typeof fetch;
}

/**
 * Auth endpoints that are safe to expose to the browser.
 * login / register / refresh / logout return tokens, so they live server-side only
 * (see `lib/server/auth.ts`) and are blocked on the proxy.
 */
export const authApi = {
	/** GET /auth/me */
	async me(options: ApiOptions = {}) {
		return (await fetchApi<User>('/auth/me', options)).data!;
	},

	/** POST /auth/change-password — revokes all refresh tokens on success. */
	changePassword(
		input: { currentPassword: string; newPassword: string },
		options: ApiOptions = {}
	) {
		return fetchApi('/auth/change-password', {
			...options,
			method: 'POST',
			body: { current_password: input.currentPassword, new_password: input.newPassword }
		});
	},

	/** POST /auth/forgot-password — always succeeds for well-formed emails (anti-enumeration). */
	forgotPassword(email: string, options: ApiOptions = {}) {
		return fetchApi('/auth/forgot-password', { ...options, method: 'POST', body: { email } });
	},

	/** POST /auth/reset-password — single-use token from the email link. */
	resetPassword(input: { token: string; password: string }, options: ApiOptions = {}) {
		return fetchApi('/auth/reset-password', { ...options, method: 'POST', body: input });
	}
};
