import { fail, redirect } from '@sveltejs/kit';
import { isResetTokenValid, resetPassword } from '#lib/server/passwordReset.ts';
import { isPasswordValid } from '#lib/utils/password.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token || !(await isResetTokenValid(token))) {
		redirect(303, '/forgot-password?reason=expired');
	}

	return { token };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		// Same rules as the checklist in the UI (lib/utils/password.ts); never trust the client.
		const weak = !isPasswordValid(password);
		const mismatch = password !== confirm;
		if (weak || mismatch) {
			return fail(400, { weak, mismatch });
		}

		if (!(await resetPassword(token, password))) {
			redirect(303, '/forgot-password?reason=expired');
		}

		cookies.delete('reset_email', { path: '/' });
		redirect(303, '/password-reset-success');
	}
};
