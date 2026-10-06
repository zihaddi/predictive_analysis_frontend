import { fail, redirect } from '@sveltejs/kit';
import { m } from '#lib/paraglide/messages.js';
import { requestPasswordReset } from '#lib/server/passwordReset.ts';
import { isEmail } from '#lib/utils/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	expired: url.searchParams.get('reason') === 'expired'
});

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();

		if (!isEmail(email)) {
			return fail(400, { email, error: m.error_email_invalid() });
		}

		if ((await requestPasswordReset(email)) === 'not_found') {
			return fail(400, { email, error: m.error_email_unrecognized() });
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
