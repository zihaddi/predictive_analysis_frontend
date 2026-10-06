import { dev } from '$app/env';

// Values of these keys are never printed (requests and responses).
const SECRET_KEYS = new Set([
	'password',
	'current_password',
	'new_password',
	'token',
	'access_token',
	'refresh_token'
]);
const MAX_BODY_CHARS = 600;

function redact(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(redact);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, v]) => [key, SECRET_KEYS.has(key) ? '***' : redact(v)])
		);
	}
	return value;
}

function format(body: string | null | undefined): string {
	if (!body) return '';
	let text: string;
	try {
		text = JSON.stringify(redact(JSON.parse(body)));
	} catch {
		text = body;
	}
	return text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}…` : text;
}

interface LogEntry {
	method: string;
	url: string;
	requestBody?: unknown;
	response?: Response;
	error?: unknown;
	startedAt: number;
}

/**
 * Development-only trace of every backend call (server-side requests are invisible in the browser's
 * Network tab). Prints to the dev server terminal; does nothing in production.
 */
export function logBackendCall({ method, url, requestBody, response, error, startedAt }: LogEntry) {
	if (!dev) return;

	const ms = Math.round(performance.now() - startedAt);
	const path = url.replace(/^https?:\/\/[^/]+/, '');
	const requestText = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);

	if (!response) {
		console.log(`[api] ${method} ${path} ✖ ${ms}ms — ${String(error)}`);
		return;
	}

	// clone() so the caller can still read the body; logging never blocks the request.
	void response
		.clone()
		.text()
		.then((text) => {
			const lines = [`[api] ${method} ${path} → ${response.status} ${ms}ms`];
			if (requestBody !== undefined) lines.push(`      ⇢ ${format(requestText)}`);
			if (text) lines.push(`      ⇠ ${format(text)}`);
			console.log(lines.join('\n'));
		})
		.catch(() => undefined);
}
