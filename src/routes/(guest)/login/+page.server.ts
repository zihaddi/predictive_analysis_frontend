import { fail, redirect } from '@sveltejs/kit';
import { m } from '#lib/paraglide/messages.js';
import { login } from '#lib/server/auth.ts';
import { describeError, isApiError } from '#lib/utils/apiError.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const remember = form.get('remember') === 'on';

		if (!email || !password) {
			return fail(400, { error: m.error_credentials_required() });
		}

		try {
			await login(event, { email, password, remember });
		} catch (err) {
			// 401 = wrong credentials; everything else (422, network, 5xx) is described generically.
			const error =
				isApiError(err) && err.status === 401 ? m.error_invalid_credentials() : describeError(err);
			return fail(isApiError(err) && err.status > 0 ? err.status : 503, { error });
		}

		redirect(303, '/dashboard');
	}
};
