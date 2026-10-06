export type UserRole = 'USER' | 'ADMIN';

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	is_active: boolean;
	email_verified_at?: string | null;
	created_at: string;
	updated_at: string;
}

/** Token pair returned by the backend on login / refresh. Server-side only: never sent to the browser. */
export interface AuthTokens {
	access_token: string;
	refresh_token: string;
	token_type: string;
	/** Access token lifetime in seconds. */
	expires_in: number;
}
