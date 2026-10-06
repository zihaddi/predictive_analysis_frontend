import { fail, redirect } from '@sveltejs/kit';
import { authApi } from '#lib/api/auth.ts';
import { describeError, isApiError } from '#lib/utils/apiError.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const email = cookies.get('reset_email');
	// Nothing to show without a pending request (e.g. direct visit or expired cookie).
	if (!email) redirect(303, '/forgot-password');

	return { email };
};

export const actions: Actions = {
	resend: async ({ cookies, fetch }) => {
		const email = cookies.get('reset_email');
		if (!email) redirect(303, '/forgot-password');

		try {
			await authApi.forgotPassword(email, { fetch });
		} catch (err) {
			return fail(isApiError(err) && err.status > 0 ? err.status : 503, {
				resendError: describeError(err)
			});
		}
		return { resent: true };
	}
};
