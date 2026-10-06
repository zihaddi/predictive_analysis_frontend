import { fail, redirect } from '@sveltejs/kit';
import { authApi } from '#lib/api/auth.ts';
import { m } from '#lib/paraglide/messages.js';
import { describeError, isApiError } from '#lib/utils/apiError.ts';
import { isEmail } from '#lib/utils/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	expired: url.searchParams.get('reason') === 'expired'
});

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();

		if (!isEmail(email)) {
			return fail(400, { email, error: m.error_email_invalid() });
		}

		try {
			// The backend answers "success" for unknown addresses too (anti-enumeration).
			await authApi.forgotPassword(email, { fetch });
		} catch (err) {
			return fail(isApiError(err) && err.status > 0 ? err.status : 503, {
				email,
				error: describeError(err)
			});
		}

		// Kept server-side (httpOnly) so the address never ends up in the URL or browser history.
		cookies.set('reset_email', email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 15
		});

		redirect(303, '/check-email');
	}
};
