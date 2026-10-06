import { defineEnvVars } from '@sveltejs/kit/env';

// Declare every environment variable here. SvelteKit validates them at startup and exposes them via
// `$app/env/public` (public: true) or `$app/env/private` (server-only).
export const variables = defineEnvVars({
	API_BASE_URL: {
		description: 'Backend origin, e.g. http://192.168.1.56:3000 (no trailing slash, no /api/v1).',
		schema: (value) => {
			if (!value) throw new Error('API_BASE_URL is required, e.g. http://localhost:3000');
			return value.replace(/\/+$/, '');
		}
	},
	API_PREFIX: {
		description: 'Backend REST prefix that is prepended to every endpoint path.',
		schema: (value) => (value ? `/${value.replace(/^\/+|\/+$/g, '')}` : '/api/v1')
	}
});
