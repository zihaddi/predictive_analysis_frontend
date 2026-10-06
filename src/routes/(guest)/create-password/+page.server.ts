import { fail, redirect } from '@sveltejs/kit';
import { authApi } from '#lib/api/auth.ts';
import { describeError, isApiError } from '#lib/utils/apiError.ts';
import { isPasswordValid } from '#lib/utils/password.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	// The token comes from the emailed link. There is no "validate token" endpoint, so it is checked
	// when the form is submitted (an invalid/expired token sends the user back to request a new link).
	const token = url.searchParams.get('token');
	if (!token) redirect(303, '/forgot-password?reason=expired');

	return { token };
};

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		// Same rules as the checklist in the UI (lib/utils/password.ts); never trust the client.
		const weak = !isPasswordValid(password);
		const mismatch = password !== confirm;
		if (weak || mismatch) {
			return fail(400, { weak, mismatch, serverError: undefined });
		}

		try {
			await authApi.resetPassword({ token, password }, { fetch });
		} catch (err) {
			// 400 = invalid or expired token → start over.
			if (isApiError(err) && err.status === 400) redirect(303, '/forgot-password?reason=expired');
			// 422 = the backend rejected the password itself; show its reason.
			return fail(isApiError(err) && err.status > 0 ? err.status : 503, {
				weak: false,
				mismatch: false,
				serverError: describeError(err)
			});
		}

		cookies.delete('reset_email', { path: '/' });
		redirect(303, '/password-reset-success');
	}
};
