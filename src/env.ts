import { defineEnvVars } from '@sveltejs/kit/env';

// Declare every environment variable here. SvelteKit validates them at startup
// and exposes them via `$app/env/public` (public: true) or `$app/env/private`.
export const variables = defineEnvVars({
	API_BASE_URL: {
		public: true,
		description: 'Base URL of the backend API, without trailing slash.',
		schema: (value) => value ?? ''
	}
});
