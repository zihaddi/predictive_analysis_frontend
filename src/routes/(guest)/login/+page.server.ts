import { fail, redirect } from '@sveltejs/kit';
import { m } from '#lib/paraglide/messages.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const remember = form.get('remember') === 'on';

		if (!email || !password) {
			return fail(400, { error: m.error_credentials_required() });
		}

		// TODO: replace with the real backend call, e.g.
		// const { token } = await fetchApi<{ token: string }>('/auth/login', {
		// 	method: 'POST',
		// 	body: JSON.stringify({ email, password })
		// });
		cookies.set('token', 'demo-token', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// without "remember me" the cookie lives only for the browser session
			...(remember ? { maxAge: 60 * 60 * 24 * 7 } : {})
		});

		redirect(303, '/dashboard');
	}
};
