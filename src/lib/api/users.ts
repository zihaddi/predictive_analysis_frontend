import type { ApiOptions } from '#lib/api/auth.ts';
import type { User } from '#lib/types/auth.ts';
import { fetchApi } from '#lib/utils/fetchApi.ts';

export const usersApi = {
	/** PATCH /users/profile */
	async updateProfile(input: { name: string }, options: ApiOptions = {}) {
		return (await fetchApi<User>('/users/profile', { ...options, method: 'PATCH', body: input }))
			.data!;
	}
};
