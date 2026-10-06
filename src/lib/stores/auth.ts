import { page } from '$app/state';
import type { User } from '#lib/types/auth.ts';

/**
 * Auth state for components, backed by `page.data.user`
 * (provided by src/routes/+layout.server.ts on every request).
 *
 * Only read this inside components. In hooks, load functions and actions
 * use `event.locals.user` instead.
 */
export const auth = {
	get user(): User | null {
		return (page.data.user as User | null) ?? null;
	},
	get isLoggedIn(): boolean {
		return this.user !== null;
	}
};
