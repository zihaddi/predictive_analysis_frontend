import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { loadUser } from '#lib/server/auth.ts';
import { redirect } from '@sveltejs/kit';
import { type Handle, sequence } from '@sveltejs/kit/hooks';

// Route guards. Any path starting with one of these requires a logged-in user.
const PROTECTED_PREFIXES = ['/dashboard'];

const originalHandle: Handle = async ({ event, resolve }) => {
	event.locals.theme = event.cookies.get('theme') === 'dark' ? 'dark' : 'light';

	const { pathname } = event.url;

	// API routes authenticate themselves (and refresh tokens); no need to look the user up twice.
	if (pathname.startsWith('/api/')) {
		event.locals.user = null;
		return resolve(event);
	}

	// Validates the session against the backend (GET /auth/me), refreshing tokens if needed.
	event.locals.user = await loadUser(event);

	const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

	if (isProtected && !event.locals.user) redirect(303, '/login');
	if (pathname === '/login' && event.locals.user) redirect(303, '/dashboard');

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
						.replace('%theme%', event.locals.theme === 'dark' ? 'dark' : '')
			}
		);
	});

export const handle = sequence(originalHandle, handleParaglide);
