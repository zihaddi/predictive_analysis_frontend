/** Field → messages, as returned by the backend on 422 (`{"email": ["email is required"]}`). */
export type FieldErrors = Record<string, string[]>;

/** Every backend response uses this envelope. */
export interface ApiEnvelope<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	errors?: FieldErrors;
}

export interface Paginated<T> {
	items: T[];
	page: number;
	page_size: number;
	total: number;
}
