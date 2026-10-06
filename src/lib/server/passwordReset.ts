// Password-reset backend calls. These endpoints are open (no auth header) by nature: the user has no token yet.
// TODO: replace the stubs with real calls via fetchApi() once the backend contract exists.

export type ResetRequestResult = 'sent' | 'not_found';

/** DEMO RULE: addresses containing "unrecognized" are treated as unknown, so the error state is reachable. */
export async function requestPasswordReset(email: string): Promise<ResetRequestResult> {
	return email.toLowerCase().includes('unrecognized') ? 'not_found' : 'sent';
}

/** DEMO RULE: only the token "demo" is valid. */
export async function isResetTokenValid(token: string | null): Promise<boolean> {
	return token === 'demo';
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
	void password;
	return isResetTokenValid(token);
}
