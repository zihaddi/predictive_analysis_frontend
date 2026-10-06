import type { ApiOptions } from '#lib/api/auth.ts';
import type { Paginated } from '#lib/types/api.ts';
import type { User } from '#lib/types/auth.ts';
import { fetchApi } from '#lib/utils/fetchApi.ts';

export const adminApi = {
	/** GET /admin/users — requires the ADMIN role. */
	async listUsers(params: { page?: number; pageSize?: number } = {}, options: ApiOptions = {}) {
		const res = await fetchApi<Paginated<User>>('/admin/users', {
			...options,
			query: { page: params.page ?? 1, page_size: params.pageSize ?? 10 }
		});
		return res.data!;
	}
};
