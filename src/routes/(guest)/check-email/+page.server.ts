import { redirect } from '@sveltejs/kit';
import { requestPasswordReset } from '#lib/server/passwordReset.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const email = cookies.get('reset_email');
	// Nothing to show without a pending request (e.g. direct visit or expired cookie).
	if (!email) redirect(303, '/forgot-password');

	return { email };
};

export const actions: Actions = {
	resend: async ({ cookies }) => {
		const email = cookies.get('reset_email');
		if (!email) redirect(303, '/forgot-password');

		await requestPasswordReset(email);
		return { resent: true };
	}
};
