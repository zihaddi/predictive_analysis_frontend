import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	await logout(event); // revokes the refresh token on the backend, then clears the cookies
	redirect(303, '/login');
};
